import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getGlobalIo } from "@/lib/socket-global"
import { broadcastMeritUpdate } from "@/lib/socket"

// 获取当前功德数
export async function GET() {
  try {
    // 查找或创建功德箱记录
    let meritBox = await db.meritBox.findFirst()
    
    if (!meritBox) {
      // 如果不存在记录，创建一个默认的功德箱
      meritBox = await db.meritBox.create({
        data: {
          totalMerit: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      totalMerit: meritBox.totalMerit,
      lastUpdated: meritBox.lastUpdated,
    })
  } catch (error) {
    console.error("获取功德数据失败:", error)
    return NextResponse.json(
      { success: false, error: "获取功德数据失败" },
      { status: 500 }
    )
  }
}

// 增加功德数
export async function POST() {
  try {
    // 查找或创建功德箱记录
    let meritBox = await db.meritBox.findFirst()
    
    if (!meritBox) {
      // 如果不存在记录，创建一个默认的功德箱
      meritBox = await db.meritBox.create({
        data: {
          totalMerit: 1,
        },
      })
    } else {
      // 如果存在记录，增加功德数
      meritBox = await db.meritBox.update({
        where: { id: meritBox.id },
        data: {
          totalMerit: meritBox.totalMerit + 1,
        },
      })
    }

    // Broadcast merit update via WebSocket
    const io = getGlobalIo()
    if (io) {
      broadcastMeritUpdate(io, meritBox.totalMerit, "increment")
    }

    return NextResponse.json({
      success: true,
      totalMerit: meritBox.totalMerit,
      lastUpdated: meritBox.lastUpdated,
    })
  } catch (error) {
    console.error("增加功德失败:", error)
    return NextResponse.json(
      { success: false, error: "增加功德失败" },
      { status: 500 }
    )
  }
}

// 更新功德数（管理员功能）
export async function PUT(request: NextRequest) {
  try {
    const { totalMerit, adminPassword } = await request.json()

    // 简单的密码验证
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "管理员密码错误" },
        { status: 401 }
      )
    }

    // 验证功德数是否为非负整数
    if (typeof totalMerit !== "number" || totalMerit < 0 || !Number.isInteger(totalMerit)) {
      return NextResponse.json(
        { success: false, error: "功德数必须是非负整数" },
        { status: 400 }
      )
    }

    // 查找或创建功德箱记录
    let meritBox = await db.meritBox.findFirst()
    
    if (!meritBox) {
      // 如果不存在记录，创建一个新的功德箱
      meritBox = await db.meritBox.create({
        data: {
          totalMerit: totalMerit,
        },
      })
    } else {
      // 如果存在记录，更新功德数
      meritBox = await db.meritBox.update({
        where: { id: meritBox.id },
        data: {
          totalMerit: totalMerit,
        },
      })
    }

    // Broadcast merit update via WebSocket (only if password is correct)
    const io = getGlobalIo()
    if (io) {
      broadcastMeritUpdate(io, meritBox.totalMerit, "update")
    }

    return NextResponse.json({
      success: true,
      totalMerit: meritBox.totalMerit,
      lastUpdated: meritBox.lastUpdated,
    })
  } catch (error) {
    console.error("更新功德失败:", error)
    return NextResponse.json(
      { success: false, error: "更新功德失败" },
      { status: 500 }
    )
  }
}