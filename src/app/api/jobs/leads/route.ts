import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { JobLead } from "@/types";
import { getFirestoreLeads, saveFirestoreLead, deleteFirestoreLead } from "@/lib/firebase/server_store";

export async function GET(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  let leads = memoryStore.getLeads();

  // If memoryStore is empty, fetch from Firestore
  if (leads.length === 0) {
    try {
      const dbLeads = await getFirestoreLeads();
      if (dbLeads.length > 0) {
        memoryStore.saveLeads(dbLeads);
        leads = dbLeads;
      }
    } catch (e) {
      console.warn("Could not load leads from Firestore:", e);
    }
  }

  const dailySends = memoryStore.getDailySends();
  const settings = memoryStore.getSettings();

  return NextResponse.json({
    leads,
    dailySends,
    maxEmailsPerDay: settings.maxEmailsPerDay || 20,
  });
}

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const lead: JobLead = await req.json();
    if (!lead.id) {
      lead.id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    lead.updatedAt = new Date().toISOString();
    memoryStore.saveLead(lead);

    // Save to Firestore
    await saveFirestoreLead(lead);

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    const existing = memoryStore.getLead(id);
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.saveLead(updated);

    // Update in Firestore
    await saveFirestoreLead(updated);

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
  }

  memoryStore.deleteLead(id);
  await deleteFirestoreLead(id);

  return NextResponse.json({ success: true, deletedId: id });
}
