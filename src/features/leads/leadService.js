const LEADS_KEY = "estateflow_leads_v1";
const CLIENTS_KEY = "estateflow_clients_v1";

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Appointment Scheduled",
  "Property Viewing",
  "Negotiation",
  "Converted",
  "Lost",
];

export const LEAD_SOURCES = [
  "Website",
  "Zillow",
  "Realtor.com",
  "Facebook",
  "Referral",
  "Phone",
  "Walk-in",
];

export const AGENTS = [
  "Alex Morgan",
  "Sarah Johnson",
  "Daniel Carter",
  "Emily Davis",
];

const initialLeads = [
  {
    id: "lead-1001",
    name: "Olivia Bennett",
    email: "olivia.bennett@example.com",
    phone: "+1 (415) 555-0132",
    source: "Website",
    status: "Qualified",
    assignedTo: "Sarah Johnson",
    budget: 650000,
    propertyType: "Condo",
    location: "San Francisco, CA",
    notes: [
      {
        id: "note-1",
        text: "Looking for a two-bedroom condo near public transit.",
        createdAt: "2026-10-15T10:30:00.000Z",
        author: "Sarah Johnson",
      },
    ],
    activities: [
      {
        id: "activity-1",
        type: "created",
        text: "Lead created from the website.",
        createdAt: "2026-10-12T09:00:00.000Z",
      },
      {
        id: "activity-2",
        type: "status",
        text: "Lead qualified after initial conversation.",
        createdAt: "2026-10-15T10:30:00.000Z",
      },
    ],
    followUpDate: "2026-10-22",
    createdAt: "2026-10-12T09:00:00.000Z",
  },
  {
    id: "lead-1002",
    name: "Noah Williams",
    email: "noah.williams@example.com",
    phone: "+1 (212) 555-0184",
    source: "Referral",
    status: "Contacted",
    assignedTo: "Alex Morgan",
    budget: 850000,
    propertyType: "House",
    location: "Brooklyn, NY",
    notes: [],
    activities: [
      {
        id: "activity-3",
        type: "created",
        text: "Lead added from a referral.",
        createdAt: "2026-10-14T11:15:00.000Z",
      },
    ],
    followUpDate: "2026-10-21",
    createdAt: "2026-10-14T11:15:00.000Z",
  },
  {
    id: "lead-1003",
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    phone: "+1 (512) 555-0168",
    source: "Zillow",
    status: "Appointment Scheduled",
    assignedTo: "Emily Davis",
    budget: 475000,
    propertyType: "Townhouse",
    location: "Austin, TX",
    notes: [],
    activities: [
      {
        id: "activity-4",
        type: "created",
        text: "Lead received from Zillow.",
        createdAt: "2026-10-16T14:00:00.000Z",
      },
    ],
    followUpDate: "2026-10-20",
    createdAt: "2026-10-16T14:00:00.000Z",
  },
  {
    id: "lead-1004",
    name: "Liam Anderson",
    email: "liam.anderson@example.com",
    phone: "+1 (305) 555-0121",
    source: "Facebook",
    status: "New",
    assignedTo: "Daniel Carter",
    budget: 550000,
    propertyType: "Apartment",
    location: "Miami, FL",
    notes: [],
    activities: [
      {
        id: "activity-5",
        type: "created",
        text: "Lead received from Facebook.",
        createdAt: "2026-10-18T08:45:00.000Z",
      },
    ],
    followUpDate: "",
    createdAt: "2026-10-18T08:45:00.000Z",
  },
  {
    id: "lead-1005",
    name: "Sophia Martinez",
    email: "sophia.martinez@example.com",
    phone: "+1 (206) 555-0177",
    source: "Realtor.com",
    status: "Property Viewing",
    assignedTo: "Sarah Johnson",
    budget: 720000,
    propertyType: "House",
    location: "Seattle, WA",
    notes: [],
    activities: [
      {
        id: "activity-6",
        type: "created",
        text: "Lead received from Realtor.com.",
        createdAt: "2026-10-10T13:20:00.000Z",
      },
    ],
    followUpDate: "2026-10-23",
    createdAt: "2026-10-10T13:20:00.000Z",
  },
  {
    id: "lead-1006",
    name: "Ethan Wilson",
    email: "ethan.wilson@example.com",
    phone: "+1 (617) 555-0149",
    source: "Phone",
    status: "Negotiation",
    assignedTo: "Alex Morgan",
    budget: 925000,
    propertyType: "Condo",
    location: "Boston, MA",
    notes: [],
    activities: [
      {
        id: "activity-7",
        type: "created",
        text: "Lead created after an inbound phone call.",
        createdAt: "2026-10-08T16:10:00.000Z",
      },
    ],
    followUpDate: "2026-10-24",
    createdAt: "2026-10-08T16:10:00.000Z",
  },
  {
    id: "lead-1007",
    name: "Isabella Garcia",
    email: "isabella.garcia@example.com",
    phone: "+1 (702) 555-0193",
    source: "Walk-in",
    status: "New",
    assignedTo: "Emily Davis",
    budget: 390000,
    propertyType: "Condo",
    location: "Las Vegas, NV",
    notes: [],
    activities: [
      {
        id: "activity-8",
        type: "created",
        text: "Lead created after an office visit.",
        createdAt: "2026-10-17T12:00:00.000Z",
      },
    ],
    followUpDate: "",
    createdAt: "2026-10-17T12:00:00.000Z",
  },
  {
    id: "lead-1008",
    name: "James Taylor",
    email: "james.taylor@example.com",
    phone: "+1 (303) 555-0155",
    source: "Referral",
    status: "Lost",
    assignedTo: "Daniel Carter",
    budget: 430000,
    propertyType: "House",
    location: "Denver, CO",
    notes: [],
    activities: [
      {
        id: "activity-9",
        type: "created",
        text: "Lead added from a referral.",
        createdAt: "2026-10-05T09:30:00.000Z",
      },
    ],
    followUpDate: "",
    createdAt: "2026-10-05T09:30:00.000Z",
  },
];

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addActivity(lead, type, text) {
  return {
    ...lead,
    activities: [
      {
        id: makeId("activity"),
        type,
        text,
        createdAt: new Date().toISOString(),
      },
      ...(lead.activities || []),
    ],
  };
}

export const leadService = {
  async getAll() {
    const stored = readStorage(LEADS_KEY, null);

    if (stored === null) {
      writeStorage(LEADS_KEY, initialLeads);
      return initialLeads;
    }

    return stored;
  },

  async create(values) {
    const leads = await this.getAll();

    const lead = addActivity(
      {
        ...values,
        id: makeId("lead"),
        notes: [],
        activities: [],
        createdAt: new Date().toISOString(),
      },
      "created",
      "Lead created.",
    );

    writeStorage(LEADS_KEY, [lead, ...leads]);
    return lead;
  },

  async update(id, values) {
    const leads = await this.getAll();
    const existing = leads.find((lead) => lead.id === id);

    if (!existing) throw new Error("Lead not found.");

    let updated = { ...existing, ...values };

    if (values.status && values.status !== existing.status) {
      updated = addActivity(
        updated,
        "status",
        `Status changed from ${existing.status} to ${values.status}.`,
      );
    }

    if (values.assignedTo && values.assignedTo !== existing.assignedTo) {
      updated = addActivity(
        updated,
        "assignment",
        `Lead assigned to ${values.assignedTo}.`,
      );
    }

    writeStorage(
      LEADS_KEY,
      leads.map((lead) => (lead.id === id ? updated : lead)),
    );

    return updated;
  },

  async remove(id) {
    const leads = await this.getAll();
    writeStorage(
      LEADS_KEY,
      leads.filter((lead) => lead.id !== id),
    );
  },

  async addNote(id, text, author) {
    const leads = await this.getAll();
    const lead = leads.find((item) => item.id === id);

    if (!lead) throw new Error("Lead not found.");

    const note = {
      id: makeId("note"),
      text,
      author,
      createdAt: new Date().toISOString(),
    };

    const updated = addActivity(
      { ...lead, notes: [note, ...(lead.notes || [])] },
      "note",
      `Note added: ${text}`,
    );

    writeStorage(
      LEADS_KEY,
      leads.map((item) => (item.id === id ? updated : item)),
    );

    return updated;
  },

  async setFollowUp(id, date) {
    const leads = await this.getAll();
    const lead = leads.find((item) => item.id === id);

    if (!lead) throw new Error("Lead not found.");

    const updated = addActivity(
      { ...lead, followUpDate: date },
      "follow-up",
      date ? `Follow-up scheduled for ${date}.` : "Follow-up date cleared.",
    );

    writeStorage(
      LEADS_KEY,
      leads.map((item) => (item.id === id ? updated : item)),
    );

    return updated;
  },

  async convertToClient(id) {
    const leads = await this.getAll();
    const lead = leads.find((item) => item.id === id);

    if (!lead) {
      throw new Error("Lead not found.");
    }

    if (lead.status === "Converted") {
      throw new Error("This lead has already been converted.");
    }

    const clients = readStorage(CLIENTS_KEY, []);
    const existingClient = clients.find((client) => client.sourceLeadId === id);

    if (existingClient) {
      throw new Error("A client already exists for this lead.");
    }

    const timestamp = new Date().toISOString();

    const client = {
      id: makeId("client"),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      assignedTo: lead.assignedTo,
      source: lead.source,
      sourceLeadId: lead.id,
      address: lead.location || "",
      location: lead.location || "",
      preferredLocation: lead.location || "",
      clientType: "Buyer",
      propertyType: lead.propertyType || "Single Family",
      budget: lead.budget ?? "",
      bedrooms: 0,
      bathrooms: 0,
      notes: lead.notes || [],
      activities: [
        ...(lead.activities || []),
        {
          id: makeId("client-activity"),
          type: "conversion",
          text: `Client created from lead ${lead.name}.`,
          createdAt: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const updated = addActivity(
      { ...lead, status: "Converted" },
      "conversion",
      `Lead converted to client (${client.id}).`,
    );

    writeStorage(CLIENTS_KEY, [client, ...clients]);

    writeStorage(
      LEADS_KEY,
      leads.map((item) => (item.id === id ? updated : item)),
    );

    return { client, lead: updated };
  },
};
