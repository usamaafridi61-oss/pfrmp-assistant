export async function POST(request) {
  try {
    const body = await request.json();
    const enabled = Boolean(process.env.GOOGLE_EARTH_ENGINE_CREDENTIALS);

    if (!enabled) {
      return new Response(
        JSON.stringify({
          ok: false,
          status: "failed",
          errorMessage: "Earth Engine Analysis Temporarily Unavailable",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const analysis = {
      id: crypto.randomUUID(),
      spatialLayerId: body.spatialLayerId,
      analysisType: body.analysisType || "ndvi_change",
      status: "queued",
      baselineStart: body.baselineStart,
      baselineEnd: body.baselineEnd,
      comparisonStart: body.comparisonStart,
      comparisonEnd: body.comparisonEnd,
      dataset: "COPERNICUS/S2_SR_HARMONIZED",
      createdAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ ok: true, analysis }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
