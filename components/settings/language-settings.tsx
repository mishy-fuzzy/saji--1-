"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Check, Globe } from "lucide-react"

export function LanguageSettings() {
  const { language, setLanguage } = useLocalization()

  const languageOptions = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      region: "Global",
      speakers: "1.5B+",
    },
    {
      code: "sw",
      name: "Kiswahili",
      nativeName: "Kiswahili",
      region: "East Africa",
      speakers: "140M+",
    },
    {
      code: "fr",
      name: "Français",
      nativeName: "Français",
      region: "West Africa",
      speakers: "280M+",
    },
  ]

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Language Preference
        </h3>
        <p className="text-sm text-muted-foreground">Select your preferred language for the SAJI interface</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {languageOptions.map((lang) => (
          <div
            key={lang.code}
            onClick={() => setLanguage(lang.code as any)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              language === lang.code
                ? "border-primary bg-primary/5 shadow-lg"
                : "border-border hover:border-primary/50 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">{lang.name}</h4>
                <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
              </div>
              {language === lang.code && <Check className="w-5 h-5 text-primary" />}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <p className="text-muted-foreground">Region</p>
                <p className="font-semibold text-foreground">{lang.region}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Speakers</p>
                <p className="font-semibold text-foreground">{lang.speakers}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
        Apply Language
      </Button>
    </Card>
  )
}
