/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardSummary:
 *       type: object
 *       properties:
 *         energyEfficiency:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               example: 87.5
 *             trend:
 *               type: string
 *               example: "+2.3%"
 *         problematicSites:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 12
 *             high:
 *               type: integer
 *               example: 3
 *             medium:
 *               type: integer
 *               example: 9
 *         backupStatus:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               example: 96
 *             healthy:
 *               type: integer
 *               example: 89
 *             atRisk:
 *               type: integer
 *               example: 7
 *             reliability:
 *               type: number
 *               example: 92.7
 *
 *     ConsumptionData:
 *       type: object
 *       properties:
 *         labels:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Jan", "Feb", "Mar"]
 *         datasets:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               data:
 *                 type: array
 *                 items:
 *                   type: number
 *
 *     HeatmapItem:
 *       type: object
 *       properties:
 *         siteId:
 *           type: string
 *         siteName:
 *           type: string
 *         region:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         value:
 *           type: number
 *         status:
 *           type: string
 *
 *     TicketStatusItem:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         value:
 *           type: integer
 *         color:
 *           type: string
 *
 *     AnomalyItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         site:
 *           type: string
 *         type:
 *           type: string
 *         severity:
 *           type: string
 *           enum: [CRITICAL, HIGH, MEDIUM, LOW, INFO]
 *         detail:
 *           type: string
 *         time:
 *           type: string
 *         status:
 *           type: string
 *
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard API endpoints
 *
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardSummary'
 *       401:
 *         description: Unauthorized
 *
 * @swagger
 * /dashboard/consumption:
 *   get:
 *     summary: Get consumption data for chart
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Time period for grouping data
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Consumption chart data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ConsumptionData'
 *
 * @swagger
 * /dashboard/heatmap:
 *   get:
 *     summary: Get heatmap data for sites
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Heatmap data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HeatmapItem'
 *
 * @swagger
 * /dashboard/ticket-status:
 *   get:
 *     summary: Get ticket status distribution for pie chart
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket status distribution
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TicketStatusItem'
 *
 * @swagger
 * /dashboard/anomalies:
 *   get:
 *     summary: Get recent anomalies for table
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of anomalies to return
 *     responses:
 *       200:
 *         description: List of recent anomalies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AnomalyItem'
 */

export {};
