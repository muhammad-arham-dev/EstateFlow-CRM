import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Edit3,
  Eye,
  Filter,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  UserRoundCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../features/auth/AuthContext'
import {
  AGENTS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_TYPES,
  LEAD_PRIORITIES,
  LEAD_CONVERSION_STATUSES,
  leadService,
} from '../features/leads/leadService'
import '../styles/leads.css'


const emptyForm = {
  name: '',
  email: '',
  phone: '',
  leadType: 'Buyer',
  priority: 'Medium',
  source: 'Website',
  status: 'New',
  assignedTo: AGENTS[0],
  budget: '',
  propertyType: 'House',
  location: '',
  lastContactDate: '',
  followUpDate: '',
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function formatDate(value) {
  if (!value) return 'Not scheduled'

  const date = new Date(`${value.slice(0, 10)}T12:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function getStatusClass(status) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}


export default function LeadsPage() {
  const { user } = useAuth();

  const agentOptions =
    user?.name && !AGENTS.includes(user.name) ? [...AGENTS, user.name] : AGENTS;

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sourceFilter, setSourceFilter] = useState("All sources");
  const [agentFilter, setAgentFilter] = useState("All agents");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const selectedLead = leads.find((lead) => lead.id === selectedId) || null;

  async function loadLeads() {
    try {
      const data = await leadService.getAll();
      setLeads(data);
    } catch {
      toast.error("Unable to load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchLeads() {
      try {
        const data = await leadService.getAll();

        if (!cancelled) {
          setLeads(data);
        }
      } catch {
        if (!cancelled) {
          toast.error("Unable to load leads.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLeads();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = leads.filter((lead) => {
      const matchesSearch =
        !query ||
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.leadType,
          lead.location,
          lead.assignedTo,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus =
        statusFilter === "All statuses" || lead.status === statusFilter;

      const matchesSource =
        sourceFilter === "All sources" || lead.source === sourceFilter;

      const matchesAgent =
        agentFilter === "All agents" || lead.assignedTo === agentFilter;

      const matchesRole =
        user?.role !== "Agent" || lead.assignedTo === user?.name;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource &&
        matchesAgent &&
        matchesRole
      );
    });

    return result.sort((a, b) => {
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      if (sortOrder === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [leads, search, statusFilter, sourceFilter, agentFilter, sortOrder, user]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleLeads = filteredLeads.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const stats = useMemo(
    () => [
      {
        label: "Total leads",
        value: leads.length,
        detail: "All lead records",
        icon: UserRound,
        className: "lead-stat-blue",
      },
      {
        label: "New leads",
        value: leads.filter((lead) => lead.status === "New").length,
        detail: "Awaiting first contact",
        icon: UserRoundCheck,
        className: "lead-stat-purple",
      },
      {
        label: "Qualified",
        value: leads.filter((lead) => lead.status === "Qualified").length,
        detail: "Potential opportunities",
        icon: Check,
        className: "lead-stat-green",
      },
      {
        label: "Follow-ups",
        value: leads.filter((lead) => {
          if (!lead.followUpDate) return false;
          if (["Converted", "Lost", "Unqualified"].includes(lead.status)) return false;
          return lead.followUpDate <= new Date().toISOString().slice(0, 10);
        }).length,
        detail: "Due today or overdue",
        icon: CalendarDays,
        className: "lead-stat-orange",
      },
    ],
    [leads],
  );

  function openCreateModal() {
    setEditingLead(null);
    setForm({
      ...emptyForm,
      assignedTo: user?.role === "Agent" ? user.name : AGENTS[0],
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(lead) {
    setEditingLead(lead);
    setForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      leadType: lead.leadType || "Buyer",
      priority: lead.priority || "Medium",
      source: lead.source || "Website",
      status: lead.status || "New",
      assignedTo: lead.assignedTo || AGENTS[0],
      budget: lead.budget ?? "",
      propertyType: lead.propertyType || "House",
      location: lead.location || "",
      lastContactDate: lead.lastContactDate || "",
      followUpDate: lead.followUpDate || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function openLeadDetails(lead) {
    setFollowUpDate(lead.followUpDate || "");
    setSelectedId(lead.id);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitLead(event) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError("Name, email, and phone are required.");
      return;
    }

    setSaving(true);

    try {
      const values = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        leadType: form.leadType,
        priority: form.priority,
        location: form.location.trim(),
        lastContactDate: form.lastContactDate,
        budget: Number(form.budget) || 0,
      };

      if (editingLead) {
        await leadService.update(editingLead.id, values);
        toast.success("Lead updated successfully.");
      } else {
        await leadService.create(values);
        toast.success("Lead created successfully.");
      }

      await loadLeads();
      setModalOpen(false);
    } catch (error) {
      setFormError(error.message || "Unable to save this lead.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(lead, status) {
    try {
      await leadService.update(lead.id, { status });
      await loadLeads();
      toast.success("Lead status updated.");
    } catch {
      toast.error("Unable to update the lead status.");
    }
  }

  async function updateAssignment(lead, assignedTo) {
    try {
      await leadService.update(lead.id, { assignedTo });
      await loadLeads();
      toast.success("Lead assignment updated.");
    } catch {
      toast.error("Unable to update the assignment.");
    }
  }

  async function deleteLead(lead) {
    const confirmed = window.confirm(
      `Delete the lead "${lead.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await leadService.remove(lead.id);
      if (selectedId === lead.id) setSelectedId(null);
      await loadLeads();
      toast.success("Lead deleted.");
    } catch {
      toast.error("Unable to delete this lead.");
    }
  }

  async function addNote(event) {
    event.preventDefault();

    if (!selectedLead || !noteText.trim()) return;

    try {
      await leadService.addNote(
        selectedLead.id,
        noteText.trim(),
        user?.name || "Team member",
      );
      setNoteText("");
      await loadLeads();
      toast.success("Note added.");
    } catch {
      toast.error("Unable to add the note.");
    }
  }

  async function saveFollowUp(event) {
    event.preventDefault();

    if (!selectedLead) return;

    try {
      await leadService.setFollowUp(selectedLead.id, followUpDate);
      await loadLeads();
      toast.success(
        followUpDate ? "Follow-up scheduled." : "Follow-up date cleared.",
      );
    } catch {
      toast.error("Unable to save the follow-up.");
    }
  }

  async function convertLead(lead) {
    const confirmed = window.confirm(
      `Convert ${lead.name} into a client? The lead history will be copied to the client record.`,
    );

    if (!confirmed) return;

    try {
      await leadService.convertToClient(lead.id);
      await loadLeads();
      toast.success("Lead converted to a client.");
    } catch (error) {
      toast.error(error.message || "Unable to convert this lead.");
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("All statuses");
    setSourceFilter("All sources");
    setAgentFilter("All agents");
    setSortOrder("newest");
    setPage(1);
  }

  const activeFilters =
    search ||
    statusFilter !== "All statuses" ||
    sourceFilter !== "All sources" ||
    agentFilter !== "All agents" ||
    sortOrder !== "newest";

  return (
  <section className="leads-page">
    {!selectedLead && (
      <>
        <header className="leads-page-header">
        <div>
          <span className="leads-eyebrow">CRM WORKSPACE</span>
          <b><h1>Leads</h1></b>
          <p>Track prospects, manage follow-ups, and build relationships.</p>
        </div>

        <button className="leads-primary-button" onClick={openCreateModal}>
          <Plus size={17} />
          Add lead
        </button>
      </header>

      <div className="leads-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="leads-stat-card" key={stat.label}>
              <div className={`leads-stat-icon ${stat.className}`}>
                <Icon size={19} />
              </div>
              <div className="leads-stat-copy">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </div>
            </article>
          );
        })}
      </div>

      <section className="clients-list-card">
        <div className="clients-list-heading leads-list-heading">
          <div>
            <h2>All leads</h2>
            <p>Browse and Manage your all Leads.</p>
          </div>
          <span className="clients-result-count">
            {filteredLeads.length}{' '}
            {filteredLeads.length === 1 ? 'lead' : 'leads'}
          </span>
        </div>

        <div className="clients-toolbar">
          <label className="clients-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search name, email, phone..."
              aria-label="Search leads"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>

          <label className="clients-filter">
            <Filter size={15} />
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              aria-label="Filter by status"
            >
              <option>All statuses</option>
              {LEAD_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>

          <label className="clients-filter">
            <Filter size={15} />
            <select
              value={sourceFilter}
              onChange={(event) => {
                setPage(1);
                setSourceFilter(event.target.value);
              }}
              aria-label="Filter by source"
            >
              <option>All sources</option>
              {LEAD_SOURCES.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>

          {user?.role !== "Agent" && (
            <label className="clients-filter">
              <UserRound size={15} />
              <select
                value={agentFilter}
                onChange={(event) => {
                  setPage(1);
                  setAgentFilter(event.target.value);
                }}
                aria-label="Filter by assigned agent"
              >
                <option>All agents</option>
                {agentOptions.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
          )}

          <label className="clients-filter clients-sort">
            <select
              value={sortOrder}
              onChange={(event) => {
                setPage(1)
                setSortOrder(event.target.value)
              }}
              aria-label="Sort leads"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
            </select>
            <ChevronDown size={14} />
          </label>

          {activeFilters && (
            <button
              className="clients-reset-button"
              type="button"
              onClick={resetFilters}
            >
              Reset
            </button>
          )}
        </div>

        {loading ? (
          <div className="clients-state-card" role="status">
            <span className="clients-spinner" />
            Loading leads…
          </div>
        ) : visibleLeads.length === 0 ? (
          <div className="clients-empty-state">
            <div className="clients-empty-icon">
              <Search size={24} />
            </div>
            <h3>No leads found</h3>
            <p>Try changing your search or filters, or create a new lead.</p>
            {activeFilters ? (
              <button className="clients-secondary-button" onClick={resetFilters}>
                Reset filters
              </button>
            ) : (
              <button
                className="clients-primary-button"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                Add your first lead
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="clients-table-wrap">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                      <th>Priority</th>
                      <th>Source</th>
                    <th>Status</th>
                    <th>Assigned to</th>
                    <th>Budget</th>
                    <th>Follow-up</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {visibleLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <button
                          type="button"
                          className="leads-person-cell"
                          onClick={() => openLeadDetails(lead)}
                        >
                          <span className="leads-avatar">
                            {initials(lead.name)}
                          </span>
                          <span className="leads-person-copy">
                            <strong>{lead.name}</strong>
                            <small>{lead.email}</small>
                          </span>
                        </button>
                      </td>

                      <td>
                        <span className={`leads-priority-pill lead-priority-${getStatusClass(lead.priority || "Medium")}`}>
                          {lead.priority || "Medium"}
                        </span>
                      </td>

                      <td>
                        <span className="leads-source">{lead.source}</span>
                      </td>

                      <td>
                        <select
                          className={`leads-status-select status-${getStatusClass(lead.status)}`}
                          value={lead.status}
                          onChange={(event) =>
                            updateStatus(lead, event.target.value)
                          }
                          aria-label={`Status for ${lead.name}`}
                        >
                          {LEAD_STATUSES.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        {user?.role === "Agent" ? (
                          <span className="leads-assignee">
                            <span className="leads-assignee-avatar">
                              {initials(lead.assignedTo)}
                            </span>
                            {lead.assignedTo}
                          </span>
                        ) : (
                          <select
                            className="leads-agent-select"
                            value={lead.assignedTo}
                            onChange={(event) =>
                              updateAssignment(lead, event.target.value)
                            }
                            aria-label={`Assign ${lead.name}`}
                          >
                            {agentOptions.map((agent) => (
                              <option key={agent} value={agent}>
                                {agent}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="leads-budget-cell">
                        {formatCurrency(lead.budget)}
                      </td>

                      <td>
                        <span className="leads-follow-up-cell">
                          <CalendarDays size={14} />
                          {lead.followUpDate
                            ? formatDate(lead.followUpDate)
                            : "—"}
                        </span>
                      </td>

                      <td>
                        <div className="leads-row-actions">
                          <button
                            type="button"
                            className="leads-icon-button"
                            onClick={() => openLeadDetails(lead)}
                            title="View lead"
                            aria-label={`View ${lead.name}`}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="leads-icon-button"
                            onClick={() => openEditModal(lead)}
                            title="Edit lead"
                            aria-label={`Edit ${lead.name}`}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="leads-icon-button leads-delete-button"
                            onClick={() => deleteLead(lead)}
                            title="Delete lead"
                            aria-label={`Delete ${lead.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="clients-pagination">
              <span>
                Showing{' '}
                <strong>
                  {(safePage - 1) * pageSize + 1}–
                  {Math.min(safePage * pageSize, filteredLeads.length)}
                </strong>{' '}
                of <strong>{filteredLeads.length}</strong> leads
              </span>

              <div className="clients-pagination-controls">
                <label>
                  Rows{' '}
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPage(1);
                    setPageSize(Number(event.target.value));
                  }}
                  aria-label="Rows per page"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
                </label>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ArrowLeft size={15} />
                </button>
                <span>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      </>
    )}

      {modalOpen && (
        <div
          className="leads-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <section
            className="leads-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
          >
            <header className="leads-modal-header">
              <div>
                <span className="leads-eyebrow">
                  {editingLead ? "UPDATE RECORD" : "NEW PROSPECT"}
                </span>
                <h2 id="lead-modal-title">
                  {editingLead ? "Edit lead" : "Add a new lead"}
                </h2>
                <p>Enter contact details and qualification information.</p>
              </div>
              <button
                type="button"
                className="leads-icon-button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </header>

            <form className="leads-form" onSubmit={submitLead}>
              <div className="leads-form-grid">
                <label>
                  Full name <span>*</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="e.g. Olivia Bennett"
                    required
                  />
                </label>

                <label>
                  Email address <span>*</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="name@example.com"
                    required
                  />
                </label>

                <label>
                  Phone number <span>*</span>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </label>

                <label>
                  Lead type
                  <select
                    name="leadType"
                    value={form.leadType}
                    onChange={updateField}
                  >
                    {LEAD_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Lead source
                  <select
                    name="source"
                    value={form.source}
                    onChange={updateField}
                  >
                    {LEAD_SOURCES.map((source) => (
                      <option key={source}>{source}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                  >
                    {LEAD_PRIORITIES.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    {LEAD_STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Assign to
                  <select
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={updateField}
                    disabled={user?.role === "Agent"}
                  >
                    {agentOptions.map((agent) => (
                      <option key={agent} value={agent}>
                        {agent}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Budget (USD)
                  <input
                    name="budget"
                    type="number"
                    min="0"
                    step="1000"
                    value={form.budget}
                    onChange={updateField}
                    placeholder="500000"
                  />
                </label>

                <label>
                  Property type
                  <select
                    name="propertyType"
                    value={form.propertyType}
                    onChange={updateField}
                  >
                    {[
                      "House",
                      "Condo",
                      "Apartment",
                      "Townhouse",
                      "Land",
                      "Other",
                    ].map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="leads-form-full">
                  Preferred location
                  <input
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    placeholder="City, state or neighborhood"
                  />
                </label>

                <label>
                  Last contact
                  <input
                    name="lastContactDate"
                    type="date"
                    value={form.lastContactDate}
                    onChange={updateField}
                  />
                </label>

                <label className="leads-form-full">
                  Next follow-up
                  <input
                    name="followUpDate"
                    type="date"
                    value={form.followUpDate}
                    onChange={updateField}
                  />
                </label>
              </div>

              {formError && (
                <p className="leads-form-error" role="alert">
                  {formError}
                </p>
              )}

              <footer className="leads-modal-actions">
                <button
                  type="button"
                  className="leads-secondary-button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="leads-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingLead
                      ? "Save changes"
                      : "Create lead"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {selectedLead && (
        <section className="clients-page clients-detail-page">
          <button
            type="button"
            className="clients-back-link"
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft size={16} />
            Back to leads
          </button>

          <header className="clients-detail-hero">
            <div className="clients-detail-identity">
              <span className="clients-avatar clients-avatar-large">
                {initials(selectedLead.name)}
              </span>
              <div className="clients-detail-title">
                <span className="clients-eyebrow">LEAD PROFILE</span>
                <h1 id="lead-detail-title">{selectedLead.name}</h1>
                <div className="clients-detail-meta">
                  <span>{selectedLead.source || 'Source not specified'}</span>
                  <span
                    className={`leads-status-badge status-${getStatusClass(
                      selectedLead.status,
                    )}`}
                  >
                    {selectedLead.status}
                  </span>
                  <span>{selectedLead.priority || 'Medium'} priority</span>
                  <span>Created {formatDate(selectedLead.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="clients-detail-actions">
              <button
                type="button"
                className="clients-secondary-button"
                onClick={() => openEditModal(selectedLead)}
              >
                <Edit3 size={15} />
                Edit lead
              </button>
              {user?.role !== "Agent" && (
                <button
                  type="button"
                  className="clients-danger-button"
                  onClick={() => deleteLead(selectedLead)}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              )}
              {LEAD_CONVERSION_STATUSES.includes(selectedLead.status) && (
                <button
                  type="button"
                  className="clients-primary-button"
                  onClick={() => convertLead(selectedLead)}
                >
                  <UserRoundCheck size={15} />
                  Convert to client
                </button>
              )}
            </div>
          </header>

          <div className="clients-detail-grid">
            <div className="clients-detail-main">
              <section className="clients-panel">
                <div className="clients-panel-heading">
                  <div>
                    <h2>Contact information</h2>
                    <p>Contact details and lead ownership.</p>
                  </div>
                  <UserRound size={19} />
                </div>
                <div className="clients-contact-grid">
                  <div className="clients-contact-item">
                    <Mail size={17} />
                    <div>
                      <span>Email address</span>
                      {selectedLead.email ? (
                        <a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a>
                      ) : (
                        <strong>Not provided</strong>
                      )}
                    </div>
                  </div>
                  <div className="clients-contact-item">
                    <Phone size={17} />
                    <div>
                      <span>Phone number</span>
                      {selectedLead.phone ? (
                        <a href={`tel:${selectedLead.phone}`}>{selectedLead.phone}</a>
                      ) : (
                        <strong>Not provided</strong>
                      )}
                    </div>
                  </div>
                  <div className="clients-contact-item">
                    <MapPin size={17} />
                    <div>
                      <span>Preferred location</span>
                      <strong>{selectedLead.location || 'Not specified'}</strong>
                    </div>
                  </div>
                  <div className="clients-contact-item">
                    <UserRound size={17} />
                    <div>
                      <span>Assigned agent</span>
                      <strong>{selectedLead.assignedTo || 'Unassigned'}</strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="clients-panel">
                <div className="clients-panel-heading">
                  <div>
                    <h2>Property preferences</h2>
                    <p>Requirements captured for this prospect.</p>
                  </div>
                  <Building2 size={19} />
                </div>
                <div className="clients-preference-grid">
                  <div>
                    <span>Lead type</span>
                    <strong>{selectedLead.leadType || 'Buyer'}</strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong>{selectedLead.priority || 'Medium'}</strong>
                  </div>
                  <div>
                    <span>Property type</span>
                    <strong>{selectedLead.propertyType || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span>Budget</span>
                    <strong>{formatCurrency(selectedLead.budget)}</strong>
                  </div>
                  <div>
                    <span>Lead source</span>
                    <strong>{selectedLead.source || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span>Lead status</span>
                    <strong>{selectedLead.status || 'New'}</strong>
                  </div>
                </div>
              </section>

              <section className="clients-panel">
                <div className="clients-panel-heading">
                  <div>
                    <h2>Activity timeline</h2>
                    <p>Updates and interactions recorded for this lead.</p>
                  </div>
                  <Clock3 size={19} />
                </div>
                {(selectedLead.activities || []).length === 0 ? (
                  <div className="clients-empty-inline">
                    <CalendarDays size={22} />
                    <p>No activity recorded yet.</p>
                    <span>Updates and interactions will appear here.</span>
                  </div>
                ) : (
                  <div className="clients-timeline">
                    {selectedLead.activities.map((activity) => (
                      <article
                        className="clients-timeline-item"
                        key={activity.id}
                      >
                        <span className="clients-timeline-dot" />
                        <div className="clients-timeline-copy">
                          <div className="clients-timeline-top">
                            <strong>{activity.text}</strong>
                            <time>{formatDateTime(activity.createdAt)}</time>
                          </div>
                          {activity.author && <small>By {activity.author}</small>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {(selectedLead.notes || []).length > 0 && (
                <section className="clients-panel">
                  <div className="clients-panel-heading">
                    <div>
                      <h2>Notes history</h2>
                      <p>Notes saved by the team.</p>
                    </div>
                  </div>
                  <div className="clients-notes-list">
                    {selectedLead.notes.map((note) => (
                      <article className="clients-note-item" key={note.id}>
                        <p>{note.text}</p>
                        <span>{note.author} · {formatDateTime(note.createdAt)}</span>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="clients-detail-side">
              <section className="clients-panel">
                <div className="clients-panel-heading">
                  <div>
                    <h2>Add a note</h2>
                    <p>Record a call, preference, or next step.</p>
                  </div>
                  <MessageSquare size={17} />
                </div>
                <form className="clients-note-form" onSubmit={addNote}>
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Write a note..."
                    aria-label="New lead note"
                  />
                  <button
                    type="submit"
                    className="clients-primary-button"
                    disabled={!noteText.trim()}
                  >
                    Add note
                  </button>
                </form>
              </section>

              <section className="clients-panel">
                <div className="clients-panel-heading">
                  <div>
                    <h2>Follow-up reminder</h2>
                    <p>Set or update the next follow-up date.</p>
                  </div>
                  <CalendarDays size={17} />
                </div>
                <form className="clients-follow-up-form" onSubmit={saveFollowUp}>
                  <label htmlFor="lead-follow-up-date">Follow-up date</label>
                  <input
                    id="lead-follow-up-date"
                    type="date"
                    value={followUpDate}
                    onChange={(event) => setFollowUpDate(event.target.value)}
                  />
                  <button type="submit" className="clients-primary-button">
                    Save follow-up
                  </button>
                </form>
              </section>

              <section className="clients-panel clients-summary-panel">
                <h2>Record summary</h2>
                <div>
                  <span>Lead status</span>
                  <strong>{selectedLead.status || 'New'}</strong>
                </div>
                  <div>
                    <span>Created</span>
                    <strong>{formatDate(selectedLead.createdAt)}</strong>
                  </div>
                  <div>
                    <span>Assigned to</span>
                    <strong>{selectedLead.assignedTo || 'Unassigned'}</strong>
                  </div>
                  <div>
                    <span>Budget</span>
                    <strong>{formatCurrency(selectedLead.budget)}</strong>
                  </div>
                  <div>
                    <span>Last contact</span>
                    <strong>
                      {selectedLead.lastContactDate
                        ? formatDate(selectedLead.lastContactDate)
                        : 'Not recorded'}
                    </strong>
                  </div>
                  <div>
                    <span>Next follow-up</span>
                    <strong>{formatDate(selectedLead.followUpDate)}</strong>
                  </div>
                  <div>
                    <span>Activities</span>
                    <strong>{(selectedLead.activities || []).length}</strong>
                  </div>
                  <div>
                    <span>Notes</span>
                    <strong>{(selectedLead.notes || []).length}</strong>
                  </div>
              </section>
            </aside>
          </div>
        </section>
      )}
    </section>
  );
}
