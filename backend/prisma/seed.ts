import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Seed script to initialize Dhaka Tesla Pool cast and vehicle
// Cast: Jashim (Driver), Bullet (Vehicle, cap 3), Nusrat, Rafiq, Shirin (Passengers)
export async function seed() {
  console.log("🌱 Seeding Dhaka Tesla Pool database...");

  const defaultPassword = "password123";
  const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

  // 1. Seed Driver: Jashim
  const jashim = await prisma.user.upsert({
    where: { email: "jashim@example.com" },
    update: {},
    create: {
      name: "Jashim",
      email: "jashim@example.com",
      passwordHash,
      role: Role.DRIVER,
    },
  });
  console.log(`✓ Driver seeded: ${jashim.name} (${jashim.email})`);

  // 2. Seed Jashim's Vehicle: Bullet (capacity 3 battery-powered vehicle)
  const bullet = await prisma.vehicle.upsert({
    where: { registrationNumber: "DHK-TESLA-001" },
    update: {
      driverId: jashim.id,
      isOnline: true,
    },
    create: {
      driverId: jashim.id,
      name: "Bullet",
      registrationNumber: "DHK-TESLA-001",
      capacity: 3,
      isOnline: true,
    },
  });
  console.log(`✓ Vehicle seeded: ${bullet.name} (Cap: ${bullet.capacity}, Driver: Jashim)`);

  // 3. Seed Passenger: Nusrat (Banani -> Mohakhali)
  const nusrat = await prisma.user.upsert({
    where: { email: "nusrat@example.com" },
    update: {},
    create: {
      name: "Nusrat",
      email: "nusrat@example.com",
      passwordHash,
      role: Role.PASSENGER,
    },
  });
  console.log(`✓ Passenger seeded: ${nusrat.name} (${nusrat.email})`);

  // 4. Seed Passenger: Rafiq (Banani -> Gulshan 1)
  const rafiq = await prisma.user.upsert({
    where: { email: "rafiq@example.com" },
    update: {},
    create: {
      name: "Rafiq",
      email: "rafiq@example.com",
      passwordHash,
      role: Role.PASSENGER,
    },
  });
  console.log(`✓ Passenger seeded: ${rafiq.name} (${rafiq.email})`);

  // 5. Seed Passenger: Shirin (Concurrent last-seat contestant)
  const shirin = await prisma.user.upsert({
    where: { email: "shirin@example.com" },
    update: {},
    create: {
      name: "Shirin",
      email: "shirin@example.com",
      passwordHash,
      role: Role.PASSENGER,
    },
  });
  console.log(`✓ Passenger seeded: ${shirin.name} (${shirin.email})`);

  console.log("✨ Seeding completed successfully!");
}

if (process.env.NODE_ENV !== "test") {
  seed()
    .catch((e) => {
      console.error("❌ Seeding error:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
