const API_HOST = process.env.REPLICATE_API_HOST || "https://api.replicate.com";

export default async function handler(req, res) {
  try {
    // Remove null and undefined values
    req.body = Object.entries(req.body).reduce(
      (a, [k, v]) => (v == null ? a : ((a[k] = v), a)),
      {}
    );

    if (req.body.mask) {
      req.body.mask = addBackgroundToPNG(req.body.mask);
    }

    const body = JSON.stringify({
      version:
        "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
      input: {
        prompt: `${req.body.prompt}, photograph, 35mm`, // Append a directive for monochromatic color scheme
        width: 576,
        height: 768,
        num_outputs: 3,
        mask: req.body.mask ? addBackgroundToPNG(req.body.mask) : undefined,
      },
    });

    const response = await fetch(`${API_HOST}/v1/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (response.status !== 201) {
      const error = await response.json();
      res.status(500).json({ detail: error.detail });
      return;
    }

    const prediction = await response.json();
    res.status(201).json(prediction);
  } catch (error) {
    res.status(500).json({ detail: "Internal Server Error" });
  }
}

function addBackgroundToPNG(mask) {
  // Add your implementation for adding background to PNG here
  return mask;
}
