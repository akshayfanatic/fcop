import type { RequestHandler } from 'express';
import { z } from 'zod';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { invitationService } from '../services/invitation.service.js';
import { inviteMemberSchema } from '../validators/invitation.validator.js';

export const invitationController = {
  inviteMember: (async (req, res, next) => {
    try {
      const payload = inviteMemberSchema.parse(req.body);
      const invitation = await invitationService.inviteMember(payload, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Invitation created successfully.',
          data: invitation
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler
};
