import type { RequestHandler } from 'express';
import { z } from 'zod';
import { proposalService } from '../services/proposal.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';
import { sendValidationError } from '../utils/http-error.js';
import { createProposalSchema, serviceRequestProposalParamsSchema, updateProposalSchema } from '../validators/proposal.validator.js';

export const proposalController = {
  createProposal: (async (req, res, next) => {
    try {
      const { serviceRequestId } = serviceRequestProposalParamsSchema.parse(req.params);
      const payload = createProposalSchema.parse(req.body);
      const proposal = await proposalService.createProposal(serviceRequestId, payload, req.headers);

      res.status(HttpStatus.CREATED).json(
        ApiResponse({
          success: true,
          status: HttpStatus.CREATED,
          message: 'Proposal created successfully.',
          data: proposal
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  getProposal: (async (req, res, next) => {
    try {
      const { serviceRequestId } = serviceRequestProposalParamsSchema.parse(req.params);
      const proposal = await proposalService.getProposal(serviceRequestId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Proposal fetched successfully.',
          data: proposal
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  updateProposal: (async (req, res, next) => {
    try {
      const { serviceRequestId } = serviceRequestProposalParamsSchema.parse(req.params);
      const payload = updateProposalSchema.parse(req.body);
      const proposal = await proposalService.updateProposal(serviceRequestId, payload, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Proposal updated successfully.',
          data: proposal
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendValidationError(res, error);
        return;
      }

      next(error);
    }
  }) satisfies RequestHandler,

  deleteProposal: (async (req, res, next) => {
    try {
      const { serviceRequestId } = serviceRequestProposalParamsSchema.parse(req.params);
      const proposal = await proposalService.deleteProposal(serviceRequestId, req.headers);

      res.status(HttpStatus.OK).json(
        ApiResponse({
          success: true,
          status: HttpStatus.OK,
          message: 'Proposal deleted successfully.',
          data: proposal
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
