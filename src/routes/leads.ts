import { Router } from 'express';
import { leadController } from '../controllers/lead.controller.js';

export const leadRouter = Router();

leadRouter.post('/public', leadController.createPublicLead);
