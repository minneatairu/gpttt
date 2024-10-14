const API_HOST = process.env.REPLICATE_API_HOST || "https://api.replicate.com";

console.log({ API_HOST });

export default async function handler(req, res) {
  try {
    const response = await fetch(`${API_HOST}/v1/predictions/${req.query.id}`, {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      const error = await response.json();
      res.status(500).json({ detail: error.detail });
      return;
    }

    const prediction = await response.json();
    res.status(200).json(prediction);
  } catch (error) {
    res.status(500).json({ detail: "Internal Server Error" });
  }
}
