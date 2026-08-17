"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import CapacityModuleCard from "@/components/capacityBuilding/CapacityModuleCard";
import {
  getCapacityDashboardSummary,
  getCapacityGroupSummaries,
} from "@/lib/capacityBuilding/metrics";

export default function CapacityBuildingPage() {
  const { data } = useData();
  const { canWrite } = useAuth();
  const summary = useMemo(() => getCapacityDashboardSummary(data), [data]);
  const groups = useMemo(() => getCapacityGroupSummaries(data), [data]);
  const [filter, setFilter] = useState("all");

  const filteredGroups = useMemo(() => {
    if (filter === "all") return groups;
    return groups.filter((g) => g.status === filter);
  }, [groups, filter]);

  return (
    <main className="container ntfp-module">
      <div className="breadcrumb">
        <Link href="/">Dashboard</Link> / Capacity Building
      </div>

      <div className="page-header-banner">
        <div>
          <h1>Capacity Building</h1>
          <p className="sub">
            Track the BTASP Global Capacity Building Plan across nine groups — planned events,
            completed events, remaining events, participants and evidence.
          </p>
        </div>
        <div className="page-header-actions">
          {canWrite ? (
            <Link href="/capacity-building/manual-entry" className="btn-primary">
              Manual Entry
            </Link>
          ) : null}
          <Link href="/capacity-building/events" className="btn-secondary">
            Events Register
          </Link>
          <Link href="/capacity-building/calendar" className="btn-secondary">
            Calendar
          </Link>
          <Link href="/module-import" className="btn-secondary">
            Import Plan
          </Link>
        </div>
      </div>

      <section className="grid ntfp-kpi-grid">
        <div className="card stat-card col-3">
          <div className="stat-label">Planned Events</div>
          <p className="stat-value">{summary.plannedEvents.toLocaleString()}</p>
          <div className="stat-foot muted small">{summary.groupCount} module groups</div>
        </div>
        <div className="card stat-card col-3 stat-physical">
          <div className="stat-label">Completed Events</div>
          <p className="stat-value">{summary.completedEvents.toLocaleString()}</p>
          <div className="stat-foot muted small">{summary.remainingEvents} remaining</div>
        </div>
        <div className="card stat-card col-3">
          <div className="stat-label">Scheduled Events</div>
          <p className="stat-value">{summary.scheduledEvents.toLocaleString()}</p>
          <div className="stat-foot muted small">{summary.upcomingEvents} upcoming</div>
        </div>
        <div className="card stat-card col-3">
          <div className="stat-label">Overall Completion</div>
          <p className="stat-value">{summary.eventCompletionPercent.toFixed(1)}%</p>
          <div className="stat-foot muted small">
            {summary.delayedEvents} delayed where a date exists
          </div>
        </div>
        <div className="card stat-card col-3">
          <div className="stat-label">Planned Participants</div>
          <p className="stat-value">{summary.plannedParticipants.toLocaleString()}</p>
          <div className="stat-foot muted small">Participant places in the plan</div>
        </div>
        <div className="card stat-card col-3">
          <div className="stat-label">Actual Participants</div>
          <p className="stat-value">{summary.actualParticipants.toLocaleString()}</p>
          <div className="stat-foot muted small">From completed events</div>
        </div>
      </section>

      <section className="grid">
        <div className="card col-12 card-header-row">
          <div>
            <h3>Module Groups ({filteredGroups.length})</h3>
            <p className="small muted">
              Open a group to record completed events against the exact Excel activity codes.
            </p>
          </div>
          <div className="filter-pill-group">
            <button
              type="button"
              className={`pill-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({groups.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${filter === "in_progress" ? "active" : ""}`}
              onClick={() => setFilter("in_progress")}
            >
              In Progress
            </button>
            <button
              type="button"
              className={`pill-btn ${filter === "not_started" ? "active" : ""}`}
              onClick={() => setFilter("not_started")}
            >
              Not Started
            </button>
            <button
              type="button"
              className={`pill-btn ${filter === "completed" ? "active" : ""}`}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="card col-12">
            <p className="sub">Import the Capacity Building Plan to populate module groups.</p>
            <Link href="/module-import" className="btn-primary">
              Import Plan
            </Link>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.moduleGroupCode || group.moduleGroupName} className="col-4">
              <CapacityModuleCard group={group} />
            </div>
          ))
        )}
      </section>
    </main>
  );
}
