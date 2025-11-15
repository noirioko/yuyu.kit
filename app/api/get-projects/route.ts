import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('📥 Fetching projects for user:', userId);

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId parameter'
      }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database not initialized'
      }, { status: 500 });
    }

    // Fetch all projects for this user
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', userId)
    );

    const projectsSnapshot = await getDocs(projectsQuery);
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      icon: doc.data().icon || '📁',
      color: doc.data().color,
      assetCount: doc.data().assetCount || 0
    }));

    console.log(`✅ Found ${projects.length} projects`);

    return NextResponse.json({
      success: true,
      projects: projects
    });

  } catch (error: any) {
    console.error('❌ Error fetching projects:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch projects'
    }, { status: 500 });
  }
}

// Handle CORS for extension
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
