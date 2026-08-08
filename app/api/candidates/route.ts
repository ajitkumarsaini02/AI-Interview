import { NextResponse, NextRequest } from 'next/server';
import { getCandidates, getCurriculum, addCandidate, deleteCandidate } from '../../../lib/data-loader';
import { Candidate } from '../../../types/candidate';

export async function GET() {
  try {
    const candidatesData = getCandidates();
    const curriculumData = getCurriculum();
    return NextResponse.json({
      candidates: candidatesData.candidates,
      curriculum: curriculumData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch candidate and curriculum data', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, jobRole, yearsExperience, education, focusAreas } = body;

    if (!name || !jobRole) {
      return NextResponse.json({ error: 'Name and Job Role are required' }, { status: 400 });
    }

    const existingCandidates = getCandidates().candidates;
    const newIdNum = existingCandidates.length + 1;
    const id = `CAND-${newIdNum < 10 ? `00${newIdNum}` : newIdNum < 100 ? `0${newIdNum}` : newIdNum}`;

    const newCandidate: Candidate = {
      member: {
        id,
        name,
        jobRole,
        yearsExperience: Number(yearsExperience) || 3,
        education: education || 'B.S. Computer Science',
      },
      missions: [
        { day: 1, title: 'Day 1: Environment Setup', passed: true, attempts: 1 },
        { day: 5, title: 'Day 5: Vector Search Basics', passed: true, attempts: 1 },
        { day: 7, title: `Day 7: ${focusAreas?.[0] || 'Chunking strategy'}`, passed: false, attempts: 3 },
      ],
      signals: {
        commitDays: 20,
        missionsCompleted: 12,
        missionsFirstTry: 9,
      },
    };

    const updatedData = addCandidate(newCandidate);
    return NextResponse.json({ success: true, candidate: newCandidate, candidates: updatedData.candidates });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add candidate', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const updatedData = deleteCandidate(id);
    return NextResponse.json({ success: true, candidates: updatedData.candidates });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete candidate', details: error?.message }, { status: 500 });
  }
}
