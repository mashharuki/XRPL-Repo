import type { NextApiRequest, NextApiResponse } from 'next'
 
export type ResponseData = {
  WEB3_AUTH_CLIENT_ID: string;
}
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const env: ResponseData = {
    WEB3_AUTH_CLIENT_ID: process.env.WEB3_AUTH_CLIENT_ID!
  }

  res.status(200).json(env)
}