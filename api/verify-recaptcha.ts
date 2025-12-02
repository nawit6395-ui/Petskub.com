// reCAPTCHA verification removed — stub handler

export default function handler(_req: any, res: any) {
  return res.status(204).json({ success: false, message: 'reCAPTCHA removed from project' });
}
