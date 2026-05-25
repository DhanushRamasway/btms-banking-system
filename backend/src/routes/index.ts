import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import accountRouter from "./account";
import transferRouter from "./transfer";
import transactionsRouter from "./transactions";
import beneficiariesRouter from "./beneficiaries";
import userRouter from "./user";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/account", accountRouter);
router.use("/transfer", transferRouter);
router.use("/transactions", transactionsRouter);
router.use("/beneficiaries", beneficiariesRouter);
router.use("/user", userRouter);
router.use("/dashboard", dashboardRouter);

export default router;
