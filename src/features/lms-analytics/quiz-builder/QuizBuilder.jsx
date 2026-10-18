import React, { useState, useMemo } from 'react';
import {
  HelpCircle, Plus, Pencil, Trash2, Eye, Download, CheckCircle2,
  AlertCircle, Play, Save, Check, FileQuestion, BookOpen, Clock,
  ArrowRight, ShieldCheck, Sparkles
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ExportButton from '../../../components/ui/ExportButton';
import { useToast } from '../../../components/ui/Toast';
import useLocalStorage from '../../../hooks/useLocalStorage';
import useQuickAction from '../../../hooks/useQuickAction';
import { initialQuizzes } from '../../../data/lmsData';
import { initialCourses } from '../../../data/courses';
import { generateId } from '../../../utils/format';
import { exportToCSV } from '../../../utils/csv';

export default function QuizBuilder() {
  const [quizzes, setQuizzes] = useLocalStorage('meridian-quizzes', initialQuizzes);
  const [activeQuizId, setActiveQuizId] = useState(quizzes[0]?.id || 'quiz-001');
  const [questionModal, setQuestionModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [newQuizModal, setNewQuizModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [deleteQuestionConfirm, setDeleteQuestionConfirm] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const addToast = useToast();

  // Quick Create menu / command palette open the new-quiz form via ?action=new
  useQuickAction('new', () => setNewQuizModal(true));

  const currentQuiz = quizzes.find(q => q.id === activeQuizId) || quizzes[0];

  // Question Form State
  const [qFormData, setQFormData] = useState({
    type: 'multiple-choice',
    question: '',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'Option A',
    points: 5,
  });

  // Quiz Form State
  const [quizFormData, setQuizFormData] = useState({
    title: '',
    course: initialCourses[0]?.name || 'ISO 9001:2015 Fundamentals',
    description: '',
    passingScore: 80,
    timeLimit: 30,
    status: 'Published',
  });

  const handleOpenAddQuestion = () => {
    setEditQuestion(null);
    setQFormData({
      type: 'multiple-choice',
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      points: 5,
    });
    setQuestionModal(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditQuestion(q);
    setQFormData({
      type: q.type,
      question: q.question,
      options: q.options && q.options.length ? [...q.options] : ['True', 'False'],
      correctAnswer: q.correctAnswer,
      points: q.points || 5,
    });
    setQuestionModal(true);
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    let opts = qFormData.options;
    if (qFormData.type === 'true-false') {
      opts = ['True', 'False'];
    }

    // Answer validation: the answer key must be gradable.
    const answer = String(qFormData.correctAnswer || '').trim();
    if (qFormData.type === 'multiple-choice') {
      const trimmed = opts.map(o => String(o).trim());
      if (trimmed.some(o => !o)) {
        addToast('Fill in every answer option.', 'error');
        return;
      }
      if (new Set(trimmed.map(o => o.toLowerCase())).size !== trimmed.length) {
        addToast('Answer options must be different from each other.', 'error');
        return;
      }
      if (!trimmed.some(o => o.toLowerCase() === answer.toLowerCase())) {
        addToast('The correct answer must exactly match one of the options.', 'error');
        return;
      }
      opts = trimmed;
    } else if (qFormData.type === 'short-answer') {
      if (!answer) {
        addToast('Enter the expected short answer.', 'error');
        return;
      }
      opts = [];
    }

    if (editQuestion) {
      setQuizzes(prev =>
        prev.map(qz =>
          qz.id === currentQuiz.id
            ? {
                ...qz,
                questions: qz.questions.map(q =>
                  q.id === editQuestion.id
                    ? { ...qFormData, id: editQuestion.id, options: opts, points: Number(qFormData.points) }
                    : q
                ),
              }
            : qz
        )
      );
      addToast('Question updated!', 'success');
    } else {
      const newQ = {
        id: `q-${generateId()}`,
        ...qFormData,
        options: opts,
        points: Number(qFormData.points),
      };
      setQuizzes(prev =>
        prev.map(qz =>
          qz.id === currentQuiz.id
            ? { ...qz, questions: [...(qz.questions || []), newQ] }
            : qz
        )
      );
      addToast('Question added to quiz bank!', 'success');
    }
    setQuestionModal(false);
  };

  const handleDeleteQuestion = () => {
    if (!deleteQuestionConfirm) return;
    setQuizzes(prev =>
      prev.map(qz =>
        qz.id === currentQuiz.id
          ? {
              ...qz,
              questions: qz.questions.filter(q => q.id !== deleteQuestionConfirm.id),
            }
          : qz
      )
    );
    addToast('Question removed from quiz.', 'info');
    setDeleteQuestionConfirm(null);
  };

  const handleTogglePublish = () => {
    const nextStatus = currentQuiz.status === 'Published' ? 'Draft' : 'Published';
    if (nextStatus === 'Published') {
      const questions = currentQuiz.questions || [];
      if (!questions.length) {
        addToast('Add at least one question before publishing.', 'error');
        return;
      }
      const missingKey = questions.find(q => !String(q.correctAnswer || '').trim());
      if (missingKey) {
        addToast('Every question needs a correct answer before publishing.', 'error');
        return;
      }
    }
    setQuizzes(prev =>
      prev.map(qz =>
        qz.id === currentQuiz.id ? { ...qz, status: nextStatus } : qz
      )
    );
    addToast(`Quiz is now ${nextStatus}!`, 'success');
  };

  const handleCreateQuiz = (e) => {
    e.preventDefault();
    const newQuiz = {
      id: `quiz-${generateId()}`,
      ...quizFormData,
      passingScore: Number(quizFormData.passingScore),
      timeLimit: Number(quizFormData.timeLimit),
      attemptsCount: 0,
      avgScore: 0,
      questions: [],
    };
    setQuizzes(prev => [newQuiz, ...prev]);
    setActiveQuizId(newQuiz.id);
    addToast('New quiz draft created!', 'success');
    setNewQuizModal(false);
  };

  const handleStartPractice = () => {
    setUserAnswers({});
    setQuizScore(null);
    setPreviewModal(true);
  };

  const handleGradePractice = () => {
    let earned = 0;
    let total = 0;
    currentQuiz.questions.forEach(q => {
      total += q.points || 5;
      if (userAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()) {
        earned += q.points || 5;
      }
    });
    const finalPct = total > 0 ? Math.round((earned / total) * 100) : 0;
    setQuizScore({ earned, total, percentage: finalPct });
  };

  const handleExport = () => {
    const flattened = currentQuiz.questions.map((q, idx) => ({
      index: idx + 1,
      quiz: currentQuiz.title,
      type: q.type,
      question: q.question,
      options: q.options?.join(' | ') || 'N/A',
      correctAnswer: q.correctAnswer,
      points: q.points,
    }));
    exportToCSV(flattened, `${currentQuiz.title.replace(/\s+/g, '_')}_questions`, [
      { key: 'index', label: '#' },
      { key: 'question', label: 'Question' },
      { key: 'type', label: 'Type' },
      { key: 'options', label: 'Options' },
      { key: 'correctAnswer', label: 'Correct Answer' },
      { key: 'points', label: 'Points' },
    ]);
    addToast('Quiz questions exported to CSV!', 'info');
  };

  // KPIs
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);
  const publishedQuizzes = quizzes.filter(q => q.status === 'Published').length;

  return (
    <div>
      <PageHeader
        title="Quiz Builder"
        subtitle="Author competency assessments, define answer keys, and configure pass criteria."
        breadcrumbs={[
          { label: 'LMS Analytics', href: '/lms-analytics' },
          { label: 'Quiz Builder' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton onClick={handleExport} label="Export Questions" />
            <button onClick={handleStartPractice} className="btn-outline">
              <Play size={15} /> Preview Assessment
            </button>
            <button onClick={() => setNewQuizModal(true)} className="btn-primary">
              <Plus size={16} /> New Quiz
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Quizzes"
          value={quizzes.length}
          subtitle="Configured assessments"
          icon={HelpCircle}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Published & Live"
          value={publishedQuizzes}
          subtitle="Accessible to learners"
          icon={CheckCircle2}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Question Bank Size"
          value={totalQuestions}
          subtitle="Total questions across bank"
          icon={FileQuestion}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Current Exam Questions"
          value={currentQuiz?.questions?.length || 0}
          subtitle={`Passing: ${currentQuiz?.passingScore}%`}
          icon={BookOpen}
          iconColor="bg-accent/10 text-accent"
        />
      </div>

      {/* Quiz Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-2 mb-6">
        {quizzes.map(qz => (
          <button
            key={qz.id}
            onClick={() => setActiveQuizId(qz.id)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeQuizId === qz.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{qz.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              activeQuizId === qz.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {qz.questions?.length || 0} Qs
            </span>
          </button>
        ))}
      </div>

      {/* Current Quiz Overview Header */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-gray-900">{currentQuiz.title}</h2>
              <StatusBadge status={currentQuiz.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{currentQuiz.description}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
              <span>Parent Course: <strong className="text-gray-800">{currentQuiz.course}</strong></span>
              <span>Pass Score: <strong className="text-primary">{currentQuiz.passingScore}%</strong></span>
              <span>Time Limit: <strong className="text-gray-800">{currentQuiz.timeLimit} mins</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePublish}
              className={`btn-sm ${currentQuiz.status === 'Published' ? 'btn-outline text-amber-700' : 'btn-primary'}`}
            >
              {currentQuiz.status === 'Published' ? 'Revert to Draft' : 'Publish Quiz'}
            </button>
            <button onClick={handleOpenAddQuestion} className="btn-primary btn-sm">
              <Plus size={14} /> Add Question
            </button>
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4 mb-6">
        {currentQuiz.questions?.length === 0 ? (
          <div className="card p-12 text-center">
            <FileQuestion size={36} className="text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-gray-700">No questions added yet</h4>
            <p className="text-xs text-gray-400 mt-1 mb-4">Start by adding multiple choice or true/false items to this assessment.</p>
            <button onClick={handleOpenAddQuestion} className="btn-primary btn-sm mx-auto">
              <Plus size={14} /> Add First Question
            </button>
          </div>
        ) : (
          currentQuiz.questions?.map((q, idx) => (
            <div key={q.id} className="card p-5 hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="badge-primary text-2xs uppercase tracking-wide">
                        {q.type.replace('-', ' ')}
                      </span>
                      <span className="text-2xs font-semibold text-gray-400">
                        {q.points || 5} Points
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      {q.question}
                    </p>

                    {/* Options Preview */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = opt.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase();
                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                isCorrect
                                  ? 'bg-success-50 border-success text-success font-semibold'
                                  : 'bg-gray-50 border-gray-100 text-gray-600'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && <Check size={14} className="text-success shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'short-answer' && (
                      <div className="p-2.5 rounded-lg bg-success-50 border border-success/30 text-xs text-success">
                        <strong className="block mb-0.5">Model Answer:</strong>
                        {q.correctAnswer}
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit / Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditQuestion(q)}
                    className="p-1.5 text-gray-500 hover:text-info hover:bg-gray-100 rounded-lg"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteQuestionConfirm(q)}
                    className="p-1.5 text-gray-500 hover:text-danger hover:bg-gray-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={questionModal}
        onClose={() => setQuestionModal(false)}
        title={editQuestion ? 'Edit Question' : 'Add Question to Quiz'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setQuestionModal(false)}>Cancel</button>
            <button type="submit" form="quizBuilder-saveQuestion-form" className="btn-primary">Save Question</button>
          </>
        }
      >
        <form id="quizBuilder-saveQuestion-form" onSubmit={handleSaveQuestion} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quizBuilder-field-1" className="form-label">Question Type</label>
              <select id="quizBuilder-field-1"
                className="form-select"
                value={qFormData.type}
                onChange={(e) => {
                  const type = e.target.value;
                  // Multiple choice always needs four option slots (e.g. when switching from short answer).
                  const options = type === 'multiple-choice' && (qFormData.options || []).length < 4
                    ? [...(qFormData.options || []), '', '', '', ''].slice(0, 4)
                    : qFormData.options;
                  setQFormData({ ...qFormData, type, options });
                }}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True / False</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>
            <div>
              <label htmlFor="quizBuilder-field-2" className="form-label">Points</label>
              <input id="quizBuilder-field-2"
                type="number"
                min="1"
                className="form-input"
                value={qFormData.points}
                onChange={(e) => setQFormData({ ...qFormData, points: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="quizBuilder-field-3" className="form-label">Question Text *</label>
            <textarea id="quizBuilder-field-3"
              rows={3}
              required
              className="form-input"
              value={qFormData.question}
              onChange={(e) => setQFormData({ ...qFormData, question: e.target.value })}
              placeholder="e.g. Under ISO 9001:2015 Clause 7.1.5, how must equipment calibration be verified?"
            />
          </div>

          {qFormData.type === 'multiple-choice' && (
            <div className="space-y-2">
              <label className="form-label">Answer Options (4 choices)</label>
              {qFormData.options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  required
                  className="form-input text-xs"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...qFormData.options];
                    newOpts[idx] = e.target.value;
                    setQFormData({ ...qFormData, options: newOpts });
                  }}
                  placeholder={`Option ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <div>
            <label className="form-label">Correct Answer Key *</label>
            {qFormData.type === 'true-false' ? (
              <select
                className="form-select"
                value={qFormData.correctAnswer}
                onChange={(e) => setQFormData({ ...qFormData, correctAnswer: e.target.value })}
              >
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            ) : qFormData.type === 'multiple-choice' ? (
              <select
                className="form-select"
                required
                value={qFormData.options.some(o => o === qFormData.correctAnswer) ? qFormData.correctAnswer : ''}
                onChange={(e) => setQFormData({ ...qFormData, correctAnswer: e.target.value })}
              >
                <option value="" disabled>Select the correct option</option>
                {qFormData.options.filter(o => String(o).trim()).map((o, i) => <option key={i} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type="text"
                required
                className="form-input"
                value={qFormData.correctAnswer}
                onChange={(e) => setQFormData({ ...qFormData, correctAnswer: e.target.value })}
                placeholder="Must match one of the options exactly"
              />
            )}
          </div>
        </form>
      </Modal>

      {/* New Quiz Modal */}
      <Modal
        isOpen={newQuizModal}
        onClose={() => setNewQuizModal(false)}
        title="Create New Quality Quiz"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setNewQuizModal(false)}>Cancel</button>
            <button type="submit" form="quizBuilder-createQuiz-form" className="btn-primary">Create Quiz</button>
          </>
        }
      >
        <form id="quizBuilder-createQuiz-form" onSubmit={handleCreateQuiz} className="space-y-4">
          <div>
            <label htmlFor="quizBuilder-field-4" className="form-label">Quiz Title *</label>
            <input id="quizBuilder-field-4"
              type="text"
              required
              className="form-input"
              value={quizFormData.title}
              onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
              placeholder="e.g. ISO 9001 Clause 8 Operational Competency Exam"
            />
          </div>
          <div>
            <label htmlFor="quizBuilder-field-5" className="form-label">Course</label>
            <select id="quizBuilder-field-5"
              className="form-select"
              value={quizFormData.course}
              onChange={(e) => setQuizFormData({ ...quizFormData, course: e.target.value })}
            >
              {initialCourses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quizBuilder-field-6" className="form-label">Pass Threshold (%)</label>
              <input id="quizBuilder-field-6"
                type="number"
                min="50"
                max="100"
                className="form-input"
                value={quizFormData.passingScore}
                onChange={(e) => setQuizFormData({ ...quizFormData, passingScore: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="quizBuilder-field-7" className="form-label">Time Limit (mins)</label>
              <input id="quizBuilder-field-7"
                type="number"
                min="5"
                className="form-input"
                value={quizFormData.timeLimit}
                onChange={(e) => setQuizFormData({ ...quizFormData, timeLimit: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="quizBuilder-field-8" className="form-label">Description</label>
            <textarea id="quizBuilder-field-8"
              rows={2}
              className="form-input"
              value={quizFormData.description}
              onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Live Practice Assessment Preview Modal */}
      {previewModal && (
        <Modal
          isOpen={previewModal}
          onClose={() => setPreviewModal(false)}
          title={`Practice Preview: ${currentQuiz.title}`}
          size="lg"
          footer={
            <>
              {quizScore ? (
                <button className="btn-primary" onClick={() => setPreviewModal(false)}>Close Review</button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => setPreviewModal(false)}>Exit</button>
                  <button className="btn-primary" onClick={handleGradePractice}>Submit & Grade</button>
                </>
              )}
            </>
          }
        >
          <div className="space-y-6">
            {quizScore && (
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                quizScore.percentage >= currentQuiz.passingScore
                  ? 'bg-success-50 border-success/30 text-success'
                  : 'bg-danger-50 border-danger/30 text-danger'
              }`}>
                <div>
                  <h4 className="text-base font-bold">
                    {quizScore.percentage >= currentQuiz.passingScore ? 'Congratulations! You Passed! 🎉' : 'Needs Review'}
                  </h4>
                  <p className="text-xs">
                    Score: {quizScore.earned} / {quizScore.total} points ({quizScore.percentage}%) • Required: {currentQuiz.passingScore}%
                  </p>
                </div>
                <span className="text-2xl font-black">{quizScore.percentage}%</span>
              </div>
            )}

            {currentQuiz.questions?.map((q, idx) => (
              <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Question {idx + 1} ({q.points || 5} pts)</p>
                <p className="text-sm font-semibold text-gray-900 mb-3">{q.question}</p>

                {q.type === 'short-answer' ? (
                  <input
                    type="text"
                    className="form-input text-sm"
                    aria-label={`Answer for question ${idx + 1}`}
                    value={userAnswers[q.id] || ''}
                    onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                    placeholder="Type your answer"
                    disabled={!!quizScore}
                  />
                ) : (
                <div className="space-y-2">
                  {(q.options?.length ? q.options : ['True', 'False']).map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                        userAnswers[q.id] === opt ? 'bg-primary/10 border-primary font-semibold' : 'bg-white border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        checked={userAnswers[q.id] === opt}
                        onChange={() => setUserAnswers({ ...userAnswers, [q.id]: opt })}
                        className="text-primary focus:ring-primary"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Delete Question Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteQuestionConfirm}
        onClose={() => setDeleteQuestionConfirm(null)}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to remove this question from the quiz?"
      />
    </div>
  );
}
