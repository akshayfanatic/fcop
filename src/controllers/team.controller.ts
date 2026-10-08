import type { RequestHandler } from 'express';
import { teamService } from '../services/team.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

export const teamController = {
  getPublicTeam: (async (_req, res, next) => {
    try {
      const team = await teamService.getPublicTeam();
      res.status(HttpStatus.OK).json(ApiResponse({ success: true, status: HttpStatus.OK, message: 'Team fetched successfully.', data: team }));
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler
};
