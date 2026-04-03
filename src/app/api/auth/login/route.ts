import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        agency: {
          select: { id: true, name: true, slug: true, plan: true, brandPrimaryColor: true, brandSecondaryColor: true, brandAccentColor: true, brandAppName: true, brandLogoUrl: true, brandSupportEmail: true },
        },
        org: {
          select: { id: true, name: true, slug: true, industry: true, status: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 403 }
      )
    }

    // Update last login
    await db.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    })

    // Simulated tokens
    const accessToken = `db_access_${user.id}_${Date.now()}`
    const refreshToken = `db_refresh_${user.id}_${Date.now()}`

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId ?? undefined,
        orgId: user.orgId ?? undefined,
        agencyName: user.agency?.name ?? undefined,
        orgName: user.org?.name ?? undefined,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 86400, // 24 hours
      },
      agency: user.agency ?? undefined,
      org: user.org ?? undefined,
    })

    // Set a simulated session cookie
    response.cookies.set('databridge-session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login failed:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
