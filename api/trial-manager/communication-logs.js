import { sendListStub } from './lib/stub.mjs';

export default async function handler(req, res) {
  sendListStub(res, req, 'communication-logs', 'communicationLogs');
}
