import "dotenv/config";
import { z } from "zod";
import { prisma } from "./db.js";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const companySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

app.get("/companies", async (req, res) => {
  const companies = await prisma.company.findMany();
  res.json(companies);
});

app.post("/companies", async (req, res) => {
  const result = companySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const company = await prisma.company.create({ data: result.data });
  res.status(201).json(company);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});