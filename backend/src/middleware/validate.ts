// backend/src/middleware/validate.ts
import { z, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err: any) {
      return res.status(400).json({
        message: "Invalid input",
        errors: err.issues || err.message,  // `issues` is the new array of error details
      });
    }
  };
