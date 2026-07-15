import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean up existing data
  await prisma.pillarLog.deleteMany()
  await prisma.breach.deleteMany()
  await prisma.financialDeclaration.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.covenantGroup.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create Covenant Group
  const group = await prisma.covenantGroup.create({
    data: {
      name: 'The Millionaire Covenant 2026',
      effectiveDate: new Date('2026-05-01T00:00:00.000Z'),
      reviewDate: new Date('2027-05-01T00:00:00.000Z'),
      commitmentFundAmount: 5000, // $5k stake
      inviteCode: 'TESTCODE',
      timezone: 'Africa/Lagos',
    },
  })

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10)
  const usersData = [
    { name: 'Alex Holder', email: 'alex@example.com' },
    { name: 'Sarah Member', email: 'sarah@example.com' },
    { name: 'John Member', email: 'john@example.com' },
    { name: 'Mike Member', email: 'mike@example.com' },
    { name: 'Emma Member', email: 'emma@example.com' },
  ]

  const users = await Promise.all(
    usersData.map((u) =>
      prisma.user.create({
        data: {
          ...u,
          passwordHash,
        },
      })
    )
  )

  // 3. Create Memberships
  const memberships = await Promise.all(
    users.map((user, index) =>
      prisma.membership.create({
        data: {
          userId: user.id,
          groupId: group.id,
          role: index === 0 ? 'ACCOUNTABILITY_HOLDER' : 'MEMBER',
          stakeBalance: group.commitmentFundAmount,
        },
      })
    )
  )

  // 4. Create 8 Weeks of Pillar Logs
  const pillars = ['MIND', 'SPIRIT', 'BODY', 'WEALTH']
  const startDate = new Date('2026-05-01T00:00:00.000Z')
  
  for (let i = 0; i < 56; i++) { // 8 weeks = 56 days
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)

    for (const user of users) {
      for (const pillar of pillars) {
        // Randomly simulate whether they completed it (mostly true to simulate a serious group)
        const completed = Math.random() > 0.15 
        
        await prisma.pillarLog.create({
          data: {
            userId: user.id,
            pillar,
            completed,
            date: currentDate,
            note: completed && Math.random() > 0.5 ? `Private note for ${pillar} on day ${i}` : null,
          },
        })
      }
    }
  }

  // 5. Create some Breaches
  // Let's say John missed multiple days and gets a minor breach
  await prisma.breach.create({
    data: {
      userId: users[2].id, // John
      groupId: group.id,
      type: 'MINOR',
      amount: 100,
      date: new Date('2026-05-15T00:00:00.000Z'),
      note: 'Missed body pillar 3 days in a row',
    },
  })
  
  // Update John's stake balance
  await prisma.membership.update({
    where: { userId_groupId: { userId: users[2].id, groupId: group.id } },
    data: { stakeBalance: group.commitmentFundAmount - 100 },
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
