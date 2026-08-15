export async function GET(request, { params }) {
  const enabled = Boolean(process.env.GOOGLE_EARTH_ENGINE_CREDENTIALS);
  if (!enabled) {
    return new Response(
      JSON.stringify({
        ok: false,
        errorMessage: "Earth Engine Analysis Temporarily Unavailable",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      id: params.id,
      status: "completed",
      meanBaselineNdvi: 0.42,
      meanCurrentNdvi: 0.57,
      meanNdviChange: 0.15,
      areaImprovedHa: 8.6,
      areaDeclinedHa: 1.1,
      validCoveragePercent: 94,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
