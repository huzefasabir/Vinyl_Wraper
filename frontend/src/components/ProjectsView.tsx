import React, { useState } from 'react';
import { FolderKanban, Plus, Layers, Calendar, ArrowRight, Trash2, Download } from 'lucide-react';
import { SpaceImage } from '../types';
import { PRESET_SPACES } from '../data/presetSpaces';

interface ProjectsViewProps {
  onLoadSpace: (space: SpaceImage) => void;
  onNavigateToStudio: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onLoadSpace,
  onNavigateToStudio
}) => {
  const [projects, setProjects] = useState([
    {
      id: 'proj-01',
      title: 'SoHo Penthouse Kitchen Overhaul',
      spaceType: 'Kitchen Waterfall & Cabinets',
      date: '2 days ago',
      thumbnailUrl: PRESET_SPACES[0].imageUrl,
      space: PRESET_SPACES[0],
      appliedMaterialsCount: 3,
      totalAreaM2: 8.4,
      status: 'Approved Spec'
    },
    {
      id: 'proj-02',
      title: 'Minimalist Slate Spa Bathroom',
      spaceType: 'Bathroom Vanity & Walls',
      date: '1 week ago',
      thumbnailUrl: PRESET_SPACES[1].imageUrl,
      space: PRESET_SPACES[1],
      appliedMaterialsCount: 2,
      totalAreaM2: 5.2,
      status: 'In Review'
    },
    {
      id: 'proj-03',
      title: 'Tribeca Executive Studio Desk',
      spaceType: 'Office Acoustic Panel & Desk',
      date: '2 weeks ago',
      thumbnailUrl: PRESET_SPACES[2].imageUrl,
      space: PRESET_SPACES[2],
      appliedMaterialsCount: 2,
      totalAreaM2: 4.6,
      status: 'Sample Dispatched'
    }
  ]);

  const handleOpenProject = (space: SpaceImage) => {
    onLoadSpace(space);
    onNavigateToStudio();
  };

  return (
    <div className="min-h-screen bg-[#0b141c] text-[#dae3ee] pt-20 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
            <span className="text-xs font-mono font-semibold text-[#87929a] uppercase tracking-wider">
              Project Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#dae3ee] tracking-tight">
            Saved Visualizations &amp; Schedules
          </h1>
          <p className="text-xs sm:text-sm text-[#bdc8d1] mt-1">
            Manage your space renderings, client revisions, and roll schedule orders.
          </p>
        </div>

        <button
          onClick={() => {
            onLoadSpace(PRESET_SPACES[0]);
            onNavigateToStudio();
          }}
          className="px-4 py-2.5 bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] font-semibold rounded-xl text-xs shadow-lg shadow-[#38bdf8]/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Studio Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="group bg-[#141c24] rounded-2xl border border-[#3e484f]/40 hover:border-[#38bdf8]/60 p-4 transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/20"
          >
            <div>
              {/* Snapshot image */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3 bg-[#0b141c] border border-[#3e484f]/40">
                <img
                  src={proj.thumbnailUrl}
                  alt={proj.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-[#0b141c]/80 backdrop-blur-md text-[#38bdf8] text-[10px] font-mono border border-[#38bdf8]/30">
                  {proj.status}
                </span>
              </div>

              {/* Title & info */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#87929a] mb-1">
                <Calendar className="w-3 h-3" />
                <span>{proj.date}</span>
                <span>•</span>
                <span>{proj.spaceType}</span>
              </div>

              <h3 className="font-semibold text-lg text-[#dae3ee] group-hover:text-white mb-2 truncate">
                {proj.title}
              </h3>

              {/* Meta stats */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-[#182028] border border-[#3e484f]/30 text-xs mb-4">
                <div>
                  <span className="text-[10px] text-[#87929a] block">Materials</span>
                  <span className="font-mono text-[#dae3ee] font-semibold">
                    {proj.appliedMaterialsCount} Finishes
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#87929a] block">Est. Roll Area</span>
                  <span className="font-mono text-[#38bdf8] font-semibold">
                    {proj.totalAreaM2} m²
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => handleOpenProject(proj.space)}
              className="w-full py-2 bg-[#182028] hover:bg-[#38bdf8] text-[#dae3ee] hover:text-[#00354a] font-semibold rounded-xl text-xs border border-[#3e484f]/50 hover:border-[#38bdf8] transition-all flex items-center justify-center gap-2"
            >
              <span>Open in Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
