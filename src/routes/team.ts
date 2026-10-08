import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';

export const teamRouter = Router();

teamRouter.get('/', teamController.getPublicTeam);
