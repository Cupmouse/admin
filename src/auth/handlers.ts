import { NextFunction, Request, Response } from "express";
import { ADMIN_USER, ERR_DONT_HAVE_PERMISSION } from "../constants";

export const checkSession = (req: Request, res: Response, next: NextFunction): void => {
  if (typeof req.session === 'undefined') {
    next(new Error("session-express is not installed"));
    return
  }
  if (!('email' in req.session)) {
    res.status(403).json({
      error: ERR_DONT_HAVE_PERMISSION,
    });
  } else {
    // go to the next handler
    next();
  }
};

export const checkAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (req.session!.email !== ADMIN_USER) {
    res.status(403).json({
      error: ERR_DONT_HAVE_PERMISSION,
    });
  } else {
    // go to the next handler
    next();
  }
};
