import { NextResponse } from "next/server";
import axios from "axios";

export const GET = async () => {
  try {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!key || !region) {
      return NextResponse.json(
        { error: "Azure credentials not configured on server" },
        { status: 500 }
      );
    }

    const response = await axios.post(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      null,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return NextResponse.json({
      token: response.data,
      region: region,
    });
  } catch (error: any) {
    console.error("Error fetching Azure token:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to fetch speech token" },
      { status: 500 }
    );
  }
};
