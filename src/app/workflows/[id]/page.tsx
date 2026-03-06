'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  Save, ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  ListTodo, Clock, Calendar, Tag, Star, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Subtask {
  id: string;
  name: string;
}

interface WorkflowTask {
  id: string;
  name: string;
  description?: string;
  order: number;
  dueDaysOffset?: number;
  dueFrom: 'start_date' | 'event_date';
  subtasks: Subtask[];
  labels: string[];
}

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface WorkflowTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  serviceType?: string;
  tasks: WorkflowTask[];
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Default label colors
const DEFAULT_LABEL_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
];

export default function WorkflowBuilderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;
  const isNew = workflowId === 'new';

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);

  // Labels state
  const [availableLabels, setAvailableLabels] = useState<TaskLabel[]>([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_LABEL_COLORS[0]);

  // UI state
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch workflow if editing
  useEffect(() => {
    if (isNew || !user) return;

    const fetchWorkflow = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        const data = await res.json();

        if (data.success) {
          const workflow = data.data as WorkflowTemplate;
          setName(workflow.name);
          setDescription(workflow.description || '');
          setServiceType(workflow.serviceType || '');
          setIsDefault(workflow.isDefault);
          setTasks(workflow.tasks || []);
          // Expand first task by default
          if (workflow.tasks?.length > 0) {
            setExpandedTasks(new Set([workflow.tasks[0].id]));
          }
        } else {
          setError('Failed to load workflow');
        }
      } catch (err) {
        console.error('Failed to fetch workflow:', err);
        setError('Failed to load workflow');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [workflowId, isNew, user]);

  // Fetch available labels
  useEffect(() => {
    if (!user) return;

    const fetchLabels = async () => {
      try {
        const res = await fetch('/api/task-labels');
        const data = await res.json();
        if (data.success) {
          setAvailableLabels(data.data.labels);
        }
      } catch (err) {
        console.error('Failed to fetch labels:', err);
      }
    };

    fetchLabels();
  }, [user]);

  // Save workflow
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Workflow name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        serviceType: serviceType.trim() || undefined,
        isDefault,
        tasks: tasks.map((task, index) => ({
          ...task,
          order: index,
        })),
      };

      const url = isNew ? '/api/workflows' : `/api/workflows/${workflowId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/workflows');
      } else {
        setError(data.error || 'Failed to save workflow');
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setError('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  // Task management
  const addTask = () => {
    const newTask: WorkflowTask = {
      id: uuidv4(),
      name: '',
      description: '',
      order: tasks.length,
      dueFrom: 'start_date',
      subtasks: [],
      labels: [],
    };
    setTasks([...tasks, newTask]);
    setExpandedTasks(new Set([...expandedTasks, newTask.id]));
  };

  const updateTask = (taskId: string, updates: Partial<WorkflowTask>) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    expandedTasks.delete(taskId);
    setExpandedTasks(new Set(expandedTasks));
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const moveTask = (fromIndex: number, toIndex: number) => {
    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, movedTask);
    setTasks(newTasks.map((task, i) => ({ ...task, order: i })));
  };

  // Subtask management
  const addSubtask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask: Subtask = {
      id: uuidv4(),
      name: '',
    };

    updateTask(taskId, {
      subtasks: [...task.subtasks, newSubtask],
    });
  };

  const updateSubtask = (taskId: string, subtaskId: string, name: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTask(taskId, {
      subtasks: task.subtasks.map(s => 
        s.id === subtaskId ? { ...s, name } : s
      ),
    });
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTask(taskId, {
      subtasks: task.subtasks.filter(s => s.id !== subtaskId),
    });
  };

  // Label management
  const toggleTaskLabel = (taskId: string, labelId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newLabels = task.labels.includes(labelId)
      ? task.labels.filter(l => l !== labelId)
      : [...task.labels, labelId];

    updateTask(taskId, { labels: newLabels });
  };

  const createLabel = async () => {
    if (!newLabelName.trim()) return;

    try {
      const res = await fetch('/api/task-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: newLabelColor,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAvailableLabels([...availableLabels, data.data]);
        setNewLabelName('');
        setNewLabelColor(DEFAULT_LABEL_COLORS[0]);
        setShowLabelModal(false);
      }
    } catch (err) {
      console.error('Failed to create label:', err);
    }
  };

  // Drag handlers
  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetId) return;

    const fromIndex = tasks.findIndex(t => t.id === draggedTask);
    const toIndex = tasks.findIndex(t => t.id === targetId);

    if (fromIndex !== toIndex) {
      moveTask(fromIndex, toIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link
                href="/workflows"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '0.5rem',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  color: '#6B7280',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {isNew ? 'Create Workflow' : 'Edit Workflow'}
                </h1>
                <p style={{ color: '#6B7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                  {isNew ? 'Define a reusable task sequence' : 'Modify your workflow template'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: '#FF3300',
                color: '#FFFFFF',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                fontWeight: 500,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Workflow'}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#DC2626',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} />
            {error}
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
          {/* Main Content - Tasks */}
          <div>
            {/* Tasks Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ListTodo size={20} style={{ color: '#6B7280' }} />
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Tasks ({tasks.length})
                </h2>
              </div>
              <button
                onClick={addTask}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  color: '#374151',
                }}
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '0.75rem',
                  border: '1px solid #E5E7EB',
                  padding: '3rem',
                  textAlign: 'center',
                }}
              >
                <ListTodo size={48} style={{ color: '#D1D5DB', marginBottom: '1rem' }} />
                <p style={{ color: '#6B7280', marginBottom: '1rem' }}>No tasks yet</p>
                <button
                  onClick={addTask}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1rem',
                    backgroundColor: '#FF3300',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={18} />
                  Add First Task
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasks.map((task, index) => {
                  const isExpanded = expandedTasks.has(task.id);
                  const isDragging = draggedTask === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onDragOver={(e) => handleDragOver(e, task.id)}
                      onDragEnd={handleDragEnd}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '0.75rem',
                        border: isDragging ? '2px dashed #FF3300' : '1px solid #E5E7EB',
                        overflow: 'hidden',
                        opacity: isDragging ? 0.5 : 1,
                      }}
                    >
                      {/* Task Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.875rem 1rem',
                          borderBottom: isExpanded ? '1px solid #F3F4F6' : 'none',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleTaskExpanded(task.id)}
                      >
                        <div
                          style={{ cursor: 'grab', color: '#9CA3AF' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical size={18} />
                        </div>

                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#6B7280',
                          }}
                        >
                          {index + 1}
                        </div>

                        <input
                          type="text"
                          placeholder="Task name..."
                          value={task.name}
                          onChange={(e) => updateTask(task.id, { name: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            color: '#111827',
                            backgroundColor: 'transparent',
                          }}
                        />

                        {task.dueDaysOffset !== undefined && (
                          <span
                            style={{
                              backgroundColor: '#EFF6FF',
                              color: '#3B82F6',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            +{task.dueDaysOffset} days
                          </span>
                        )}

                        {task.subtasks.length > 0 && (
                          <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                            {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          style={{
                            padding: '0.375rem',
                            border: 'none',
                            borderRadius: '0.375rem',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: '#9CA3AF',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>

                        {isExpanded ? (
                          <ChevronUp size={18} style={{ color: '#9CA3AF' }} />
                        ) : (
                          <ChevronDown size={18} style={{ color: '#9CA3AF' }} />
                        )}
                      </div>

                      {/* Task Details (Expanded) */}
                      {isExpanded && (
                        <div style={{ padding: '1rem' }}>
                          {/* Description */}
                          <div style={{ marginBottom: '1rem' }}>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                color: '#374151',
                                marginBottom: '0.375rem',
                              }}
                            >
                              Description
                            </label>
                            <textarea
                              placeholder="Add task description..."
                              value={task.description || ''}
                              onChange={(e) => updateTask(task.id, { description: e.target.value })}
                              style={{
                                ...inputStyle,
                                minHeight: '80px',
                                resize: 'vertical',
                              }}
                            />
                          </div>

                          {/* Due Date Settings */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '1rem',
                              marginBottom: '1rem',
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  display: 'block',
                                  fontSize: '0.8125rem',
                                  fontWeight: 500,
                                  color: '#374151',
                                  marginBottom: '0.375rem',
                                }}
                              >
                                Due Days Offset
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={16} style={{ color: '#9CA3AF' }} />
                                <input
                                  type="number"
                                  placeholder="e.g., 7"
                                  value={task.dueDaysOffset ?? ''}
                                  onChange={(e) =>
                                    updateTask(task.id, {
                                      dueDaysOffset: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                  }
                                  style={{ ...inputStyle, flex: 1 }}
                                />
                                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>days</span>
                              </div>
                            </div>
                            <div>
                              <label
                                style={{
                                  display: 'block',
                                  fontSize: '0.8125rem',
                                  fontWeight: 500,
                                  color: '#374151',
                                  marginBottom: '0.375rem',
                                }}
                              >
                                Calculate From
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} style={{ color: '#9CA3AF' }} />
                                <select
                                  value={task.dueFrom}
                                  onChange={(e) =>
                                    updateTask(task.id, {
                                      dueFrom: e.target.value as 'start_date' | 'event_date',
                                    })
                                  }
                                  style={{ ...selectStyle, flex: 1 }}
                                >
                                  <option value="start_date">Project Start Date</option>
                                  <option value="event_date">Event Date</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Labels */}
                          <div style={{ marginBottom: '1rem' }}>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                color: '#374151',
                                marginBottom: '0.375rem',
                              }}
                            >
                              <Tag size={14} />
                              Labels
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                              {availableLabels.map((label) => {
                                const isSelected = task.labels.includes(label.id);
                                return (
                                  <button
                                    key={label.id}
                                    onClick={() => toggleTaskLabel(task.id, label.id)}
                                    style={{
                                      padding: '0.25rem 0.625rem',
                                      borderRadius: '9999px',
                                      border: isSelected ? 'none' : '1px solid #E5E7EB',
                                      backgroundColor: isSelected ? label.color : '#FFFFFF',
                                      color: isSelected ? '#FFFFFF' : '#374151',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {label.name}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => setShowLabelModal(true)}
                                style={{
                                  padding: '0.25rem 0.625rem',
                                  borderRadius: '9999px',
                                  border: '1px dashed #D1D5DB',
                                  backgroundColor: 'transparent',
                                  color: '#6B7280',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <Plus size={12} />
                                New Label
                              </button>
                            </div>
                          </div>

                          {/* Subtasks */}
                          <div>
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                color: '#374151',
                                marginBottom: '0.375rem',
                              }}
                            >
                              <CheckCircle2 size={14} />
                              Subtasks ({task.subtasks.length})
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                              {task.subtasks.map((subtask) => (
                                <div
                                  key={subtask.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '4px',
                                      border: '2px solid #D1D5DB',
                                    }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Subtask name..."
                                    value={subtask.name}
                                    onChange={(e) =>
                                      updateSubtask(task.id, subtask.id, e.target.value)
                                    }
                                    style={{
                                      ...inputStyle,
                                      flex: 1,
                                      padding: '0.375rem 0.625rem',
                                      fontSize: '0.8125rem',
                                    }}
                                  />
                                  <button
                                    onClick={() => deleteSubtask(task.id, subtask.id)}
                                    style={{
                                      padding: '0.25rem',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      color: '#9CA3AF',
                                    }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addSubtask(task.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.375rem 0.625rem',
                                  border: '1px dashed #D1D5DB',
                                  borderRadius: '0.5rem',
                                  backgroundColor: 'transparent',
                                  cursor: 'pointer',
                                  color: '#6B7280',
                                  fontSize: '0.8125rem',
                                }}
                              >
                                <Plus size={14} />
                                Add Subtask
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Task Button */}
                <button
                  onClick={addTask}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem',
                    border: '2px dashed #D1D5DB',
                    borderRadius: '0.75rem',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: '#6B7280',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={18} />
                  Add Another Task
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Workflow Settings */}
          <div>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
                Workflow Settings
              </h2>

              {/* Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.375rem',
                  }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Wedding Photography Workflow"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.375rem',
                  }}
                >
                  Description
                </label>
                <textarea
                  placeholder="Brief description of this workflow..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    ...inputStyle,
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Service Type */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.375rem',
                  }}
                >
                  Service Type
                </label>
                <input
                  type="text"
                  placeholder="e.g., Wedding, Portrait, Commercial"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  style={inputStyle}
                />
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0.25rem 0 0' }}>
                  Helps organize and filter workflows
                </p>
              </div>

              {/* Is Default */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem',
                  backgroundColor: isDefault ? '#FFFBEB' : '#F9FAFB',
                  borderRadius: '0.5rem',
                  border: isDefault ? '1px solid #FCD34D' : '1px solid #E5E7EB',
                }}
              >
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isDefault" style={{ flex: 1, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>
                    Default Workflow
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    Auto-apply to new projects of this service type
                  </div>
                </label>
                <Star size={18} style={{ color: isDefault ? '#F59E0B' : '#D1D5DB' }} />
              </div>
            </div>

            {/* Tips */}
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#EFF6FF',
                borderRadius: '0.75rem',
                border: '1px solid #BFDBFE',
              }}
            >
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E40AF', margin: '0 0 0.5rem' }}>
                💡 Tips
              </h3>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.8125rem',
                  color: '#1E40AF',
                  lineHeight: 1.6,
                }}
              >
                <li>Drag tasks to reorder them</li>
                <li>Use due day offsets for automatic deadline calculation</li>
                <li>Add subtasks for detailed checklists</li>
                <li>Labels help categorize tasks (e.g., &ldquo;Client-facing&rdquo;, &ldquo;Internal&rdquo;)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Create Label Modal */}
        {showLabelModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
            onClick={() => setShowLabelModal(false)}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
                Create New Label
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.375rem',
                  }}
                >
                  Label Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Client-facing, Internal, Urgent"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.375rem',
                  }}
                >
                  Color
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {DEFAULT_LABEL_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '0.5rem',
                        border: newLabelColor === color ? '3px solid #111827' : '2px solid #E5E7EB',
                        backgroundColor: color,
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowLabelModal(false)}
                  style={{
                    padding: '0.625rem 1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#374151',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createLabel}
                  disabled={!newLabelName.trim()}
                  style={{
                    padding: '0.625rem 1rem',
                    backgroundColor: newLabelName.trim() ? '#FF3300' : '#D1D5DB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: newLabelName.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                >
                  Create Label
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
