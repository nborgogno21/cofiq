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

const companyIdSchema = z.coerce.number().int().positive();

const productSchema = z.object({
  name: z.string().trim().min(1).max(100),
  price: z.coerce.number().positive().max(99999999.99),
});

app.get("/companies/:companyId/products", async (req, res) => {
  const companyId = companyIdSchema.safeParse(req.params.companyId);
  if (!companyId.success) {
    return res.status(400).json({ error: "Invalid company id" });
  }
  const products = await prisma.product.findMany({
    where: { companyId: companyId.data },
  });
  res.json(products);
});

app.post("/companies/:companyId/products", async (req, res) => {
  const companyId = companyIdSchema.safeParse(req.params.companyId);
  const body = productSchema.safeParse(req.body);
  if (!companyId.success || !body.success) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const company = await prisma.company.findUnique({
    where: { id: companyId.data },
  });
  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }
  const product = await prisma.product.create({
    data: { ...body.data, companyId: companyId.data },
  });
  res.status(201).json(product);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});