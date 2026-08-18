import type { RequestHandler } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

const sendDashboardResponse = (res: Parameters<RequestHandler>[1], message: string, data: unknown) => {
  res.status(HttpStatus.OK).json(
    ApiResponse({
      success: true,
      status: HttpStatus.OK,
      message,
      data
    })
  );
};

export const dashboardController = {
  getCurrentProjects: (async (req, res, next) => {
    try {
      const projects = await dashboardService.getCurrentProjects(req.headers);
      sendDashboardResponse(res, 'Current dashboard projects fetched successfully.', projects);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getOverview: (async (req, res, next) => {
    try {
      const overview = await dashboardService.getOverview(req.headers);
      sendDashboardResponse(res, 'Admin dashboard overview fetched successfully.', overview);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getLeadDistribution: (async (req, res, next) => {
    try {
      const distribution = await dashboardService.getLeadDistribution(req.headers);
      sendDashboardResponse(res, 'Admin lead distribution fetched successfully.', distribution);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getTaskDistribution: (async (req, res, next) => {
    try {
      const distribution = await dashboardService.getTaskDistribution(req.headers);
      sendDashboardResponse(res, 'Admin task distribution fetched successfully.', distribution);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getRecentLeads: (async (req, res, next) => {
    try {
      const leads = await dashboardService.getRecentLeads(req.headers);
      sendDashboardResponse(res, 'Recent admin dashboard leads fetched successfully.', leads);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler,

  getAttentionTasks: (async (req, res, next) => {
    try {
      const tasks = await dashboardService.getAttentionTasks(req.headers);
      sendDashboardResponse(res, 'Admin dashboard attention tasks fetched successfully.', tasks);
    } catch (error) {
      next(error);
    }
  }) satisfies RequestHandler
};
