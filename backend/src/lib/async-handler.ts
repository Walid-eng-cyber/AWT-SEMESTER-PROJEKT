import type { NextFunction, Request, Response } from 'express'

export type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<void>

export function asyncHandler(route: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction) => {
    route(req, res, next).catch(next)
  }
}
