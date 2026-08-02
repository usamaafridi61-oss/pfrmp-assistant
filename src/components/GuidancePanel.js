import {
  getGuidanceForIntervention,
  getImplementationGuidance,
  getRelatedGuidanceSuggestions,
} from "@/lib/guidance";

function ListSection({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="guidance-section">
      <h5>{title}</h5>
      <ul>{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}

function ImplementationGuidanceBlock({ guidance }) {
  return (
    <div className="guidance-item guidance-impl">
      <h5>Implementation Guidance</h5>
      {guidance.summary && <p>{guidance.summary}</p>}
      {guidance.objective && (
        <p><em>Objective:</em> {guidance.objective}</p>
      )}
      {guidance.whenToImplement && <p><em>When:</em> {guidance.whenToImplement}</p>}
      {guidance.whereToImplement && <p><em>Where:</em> {guidance.whereToImplement}</p>}
      {guidance.whoShouldImplement && <p><em>Who:</em> {guidance.whoShouldImplement}</p>}
      {guidance.season && <p><em>Season/timing:</em> {guidance.season}</p>}
      {guidance.spacing && <p><em>Spacing/model:</em> {guidance.spacing}</p>}
      {guidance.recommendedSpecies?.length > 0 && (
        <p><em>Recommended species:</em> {guidance.recommendedSpecies.join(", ")}</p>
      )}
      <ListSection title="Prerequisites" items={guidance.prerequisites} />
      <ListSection title="Step-by-step method" items={guidance.stepByStepMethod} />
      <ListSection title="Tools and inputs" items={guidance.toolsAndInputs} />
      <ListSection title="Technical standards" items={guidance.technicalStandards} />
      <ListSection title="Quality checks" items={guidance.qualityChecks} />
      <ListSection title="Common mistakes" items={guidance.commonMistakes} />
      <ListSection title="Safety and environmental precautions" items={guidance.safetyAndEnvironmentalPrecautions} />
      <ListSection title="Community responsibilities" items={guidance.communityResponsibilities} />
      <ListSection title="Monitoring indicators" items={guidance.monitoringIndicators} />
      <ListSection title="Evidence required" items={guidance.evidenceRequired} />
      <p className="small guidance-source">
        Source: {guidance.sourceDocumentTitle}
        {guidance.sourceSections?.length > 0 && ` — ${guidance.sourceSections.join(", ")}`}
        {guidance.sourcePages?.length > 0 && ` (pages ${guidance.sourcePages.join(", ")})`}
      </p>
    </div>
  );
}

export default function GuidancePanel({ interventionId, data }) {
  const implementation = getImplementationGuidance(interventionId, data);
  const technical = getGuidanceForIntervention(interventionId, data.technicalGuidance, data.docs);
  const suggestions = getRelatedGuidanceSuggestions(interventionId, data);
  const hasImpl = implementation.length > 0 && implementation.some((g) => g.summary || g.stepByStepMethod?.length);

  return (
    <div className="guidance-panel">
      <h4>Guideline / Manual Reference</h4>

      {hasImpl ? (
        implementation.map((g) => <ImplementationGuidanceBlock key={g.id} guidance={g} />)
      ) : (
        technical.map((g) => (
          <div key={g.id} className="guidance-item">
            <strong>{g.title}</strong>
            {g.pending ? (
              <p className="guidance-pending">
                {g.message || "Guidance pending extraction from uploaded Implementation Guidelines and PFRMP Manual."}
              </p>
            ) : (
              <>
                {g.recommendedSeason && <p><em>Season:</em> {g.recommendedSeason}</p>}
                {g.spacing && <p><em>Spacing:</em> {g.spacing}</p>}
                {g.species?.length > 0 && <p><em>Species:</em> {g.species.join(", ")}</p>}
                {g.applicableConditions && <p><em>Site conditions:</em> {g.applicableConditions}</p>}
                <ListSection title="Implementation steps" items={g.steps} />
                <ListSection title="Monitoring checklist" items={g.monitoringChecklist} />
                <ListSection title="Precautions" items={g.precautions} />
              </>
            )}
            <p className="small guidance-source">Source: {g.sourceDocumentTitle}</p>
          </div>
        ))
      )}

      {!hasImpl && suggestions.length > 0 && (
        <div className="guidance-suggestions">
          <h5>Related guideline sections</h5>
          <ul>
            {suggestions.map((s) => (
              <li key={s.id}>
                <strong>{s.interventionName}</strong> — {s.summary?.slice(0, 120)}…
                <span className="small"> ({s.sourceDocumentTitle})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="guidance-section">
        <h5>Monitoring checklist</h5>
        {hasImpl ? (
          <ul>
            {(implementation[0]?.monitoringIndicators || []).map((s, i) => <li key={i}>{s}</li>)}
            {!implementation[0]?.monitoringIndicators?.length && (
              <li className="muted">Check field records, photos, and journals per Implementation Guidelines.</li>
            )}
          </ul>
        ) : (
          <p className="guidance-pending">Upload and index Implementation Guidelines to populate the monitoring checklist.</p>
        )}
      </div>
    </div>
  );
}
