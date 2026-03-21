"use client"

import { useState } from "react"
import { ArrowLeft, Save, Award, MapPin } from "lucide-react"
import Link from "next/link"

export default function SkillsPage() {
  const [skills, setSkills] = useState([
    { id: 1, name: "Plumbing", verified: true },
    { id: 2, name: "Electrical Work", verified: true },
    { id: 3, name: "AC Repair", verified: false },
  ])
  const [workAreas, setWorkAreas] = useState(["Nairobi CBD", "Westlands", "Karen"])
  const [newSkill, setNewSkill] = useState("")
  const [newArea, setNewArea] = useState("")

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { id: Date.now(), name: newSkill, verified: false }])
      setNewSkill("")
    }
  }

  const removeSkill = (id: number) => {
    setSkills(skills.filter((s) => s.id !== id))
  }

  const addWorkArea = () => {
    if (newArea.trim() && !workAreas.includes(newArea)) {
      setWorkAreas([...workAreas, newArea])
      setNewArea("")
    }
  }

  const removeWorkArea = (area: string) => {
    setWorkAreas(workAreas.filter((a) => a !== area))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-b-2xl lg:rounded-none">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/provider/profile" className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Work Area & Skills</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6">
        {/* Skills Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Professional Skills
          </h2>

          {/* Add Skill */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === "Enter" && addSkill()}
            />
            <button
              onClick={addSkill}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add
            </button>
          </div>

          {/* Skills List */}
          <div className="space-y-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white font-medium">{skill.name}</span>
                  {skill.verified && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                      Verified
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeSkill(skill.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Work Areas Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Work Areas
          </h2>

          {/* Add Work Area */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="Add a location..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === "Enter" && addWorkArea()}
            />
            <button
              onClick={addWorkArea}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add
            </button>
          </div>

          {/* Work Areas List */}
          <div className="flex flex-wrap gap-2">
            {workAreas.map((area) => (
              <div
                key={area}
                className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-full"
              >
                <span className="text-blue-900 dark:text-blue-400 font-medium">{area}</span>
                <button
                  onClick={() => removeWorkArea(area)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>
    </div>
  )
}
