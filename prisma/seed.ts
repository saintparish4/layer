import { PrismaClient, Prisma } from "@/app/generated/prisma";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice",
    email: "alice@prisma.io",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Bob",
    email: "bob@prisma.io",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Charlie",
    email: "charlie@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Diana",
    email: "diana@example.com",
    emailVerified: false,
    image: "https://example.com/diana.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Eve",
    email: "eve@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Frank",
    email: "frank@example.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Grace",
    email: "grace@example.com",
    emailVerified: true,
    image: "https://example.com/grace.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Henry",
    email: "henry@example.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Sarah",
    email: "sarah@tailscale.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Mike",
    email: "mike@rippling.com",
    emailVerified: false,
    image: "https://example.com/mike.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Lisa",
    email: "lisa@betterauth.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "David",
    email: "david@stripe.com",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Emma",
    email: "emma@notion.so",
    emailVerified: true,
    image: "https://example.com/emma.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Alex",
    email: "alex@linear.app",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Rachel",
    email: "rachel@vercel.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
  console.log("Seeded users");
}

main();