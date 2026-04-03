'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Save,
  CheckCircle2,
  Upload,
  Eye,
  Type,
  Palette,
  Globe,
  Image as ImageIcon,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/shared/page-header'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'


const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Nunito', label: 'Nunito' },
]


const brandingSchema = z.object({
  appName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  supportEmail: z.string().email('Email invalide').or(z.literal('')),
  customDomain: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide'),
  fontFamily: z.string().min(1, 'Sélectionnez une police'),
})

type BrandingFormValues = z.infer<typeof brandingSchema>

interface BrandingData {
  brandAppName: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  brandAccentColor: string
  brandFont: string
  brandLogoUrl: string | null
  brandSupportEmail: string | null
  customDomain: string | null
  customDomainVerified: boolean
}


function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-lg border-2 border-muted bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 font-mono text-sm"
          maxLength={7}
        />
        <div
          className="h-10 flex-1 rounded-lg border"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  )
}


function LivePreview({
  primaryColor,
  secondaryColor,
  accentColor,
  fontFamily,
  appName,
}: {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  appName: string
}) {
  return (
    <Card className="overflow-hidden border-2 border-dashed">
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: secondaryColor }}
      >
        <div className="flex items-center gap-2">
          <div
            className="size-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            {appName.charAt(0)}
          </div>
          <span className="font-semibold text-white text-sm" style={{ fontFamily }}>
            {appName}
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="size-2 rounded-full bg-white/40" />
          <div className="size-2 rounded-full bg-white/40" />
          <div className="size-2 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="p-4 space-y-3 bg-white">
        <div
          className="text-lg font-bold"
          style={{ color: secondaryColor, fontFamily }}
        >
          Tableau de bord
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Revenus', value: '24,580 €' },
            { label: 'Clients', value: '156' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg p-3"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className="text-lg font-bold" style={{ color: primaryColor }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="text-white text-xs"
            style={{ backgroundColor: primaryColor }}
          >
            Exporter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Actualiser
          </Button>
        </div>
      </div>
    </Card>
  )
}


export function AgencyBranding() {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const { data: branding, isLoading: brandingLoading } = useQuery<BrandingData>({
    queryKey: ['branding', user?.agencyId],
    queryFn: async () => {
      const res = await fetch(`/api/branding?agencyId=${user?.agencyId}`)
      if (!res.ok) throw new Error('Failed to fetch branding')
      return res.json()
    },
    enabled: !!user?.agencyId,
  })

  const saveMutation = useMutation({
    mutationFn: async (data: BrandingFormValues) => {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: user?.agencyId,
          brandAppName: data.appName,
          brandPrimaryColor: data.primaryColor,
          brandSecondaryColor: data.secondaryColor,
          brandAccentColor: data.accentColor,
          brandFont: data.fontFamily,
          brandSupportEmail: data.supportEmail || null,
          customDomain: data.customDomain || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save branding')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding', user?.agencyId] })
      toast({
        title: 'Branding sauvegardé',
        description: 'Les paramètres de marque ont été mis à jour avec succès.',
      })
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres de marque.',
        variant: 'destructive',
      })
    },
  })

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      appName: 'DataBridge',
      supportEmail: '',
      customDomain: '',
      primaryColor: '#0F766E',
      secondaryColor: '#134E4A',
      accentColor: '#F59E0B',
      fontFamily: 'Inter',
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const watchedValues = watch()

  // Sync form values when branding data loads
  useEffect(() => {
    if (branding) {
      setValue('appName', branding.brandAppName)
      setValue('supportEmail', branding.brandSupportEmail ?? '')
      setValue('customDomain', branding.customDomain ?? '')
      setValue('primaryColor', branding.brandPrimaryColor)
      setValue('secondaryColor', branding.brandSecondaryColor)
      setValue('accentColor', branding.brandAccentColor)
      setValue('fontFamily', branding.brandFont)
    }
  }, [branding, setValue])

  const handleSave = async (data: BrandingFormValues) => {
    setIsSaving(true)
    try {
      await saveMutation.mutateAsync(data)
    } finally {
      setIsSaving(false)
    }
  }

  if (brandingLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Marque & Branding"
          description="Personnalisez l'apparence de la plateforme pour vos clients"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Marque & Branding"
        description="Personnalisez l'apparence de la plateforme pour vos clients"
        actions={
          <Button
            onClick={handleSubmit(handleSave)}
            disabled={isSaving || saveMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSaving || saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Sauvegarder
              </>
            )}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="size-5 text-teal-600" />
                <div>
                  <CardTitle className="text-base">Identité</CardTitle>
                  <CardDescription>Nom, email de support et domaine personnalisé</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Nom de l'application</Label>
                <Input
                  id="appName"
                  {...register('appName')}
                  placeholder="Mon App Analytics"
                />
                {errors.appName && (
                  <p className="text-xs text-red-500">{errors.appName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Email de support</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  {...register('supportEmail')}
                  placeholder="support@example.com"
                />
                {errors.supportEmail && (
                  <p className="text-xs text-red-500">{errors.supportEmail.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customDomain">Domaine personnalisé</Label>
                <div className="relative">
                  <Input
                    id="customDomain"
                    {...register('customDomain')}
                    placeholder="app.votreagence.com"
                  />
                  {watchedValues.customDomain && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-700 bg-emerald-50">
                        <CheckCircle2 className="size-3" />
                        Vérifié
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="size-5 text-teal-600" />
                <div>
                  <CardTitle className="text-base">Couleurs</CardTitle>
                  <CardDescription>Définissez la palette de couleurs de votre marque</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ColorPicker
                label="Couleur principale"
                value={watchedValues.primaryColor}
                onChange={(v) => setValue('primaryColor', v)}
              />
              {errors.primaryColor && (
                <p className="text-xs text-red-500">{errors.primaryColor.message}</p>
              )}
              <ColorPicker
                label="Couleur secondaire"
                value={watchedValues.secondaryColor}
                onChange={(v) => setValue('secondaryColor', v)}
              />
              {errors.secondaryColor && (
                <p className="text-xs text-red-500">{errors.secondaryColor.message}</p>
              )}
              <ColorPicker
                label="Couleur d'accentuation"
                value={watchedValues.accentColor}
                onChange={(v) => setValue('accentColor', v)}
              />
              {errors.accentColor && (
                <p className="text-xs text-red-500">{errors.accentColor.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Type className="size-5 text-teal-600" />
                <div>
                  <CardTitle className="text-base">Typographie</CardTitle>
                  <CardDescription>Choisissez la police principale de l'interface</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Police de caractères</Label>
                <Select
                  value={watchedValues.fontFamily}
                  onValueChange={(v) => setValue('fontFamily', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une police" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fontFamily && (
                  <p className="text-xs text-red-500">{errors.fontFamily.message}</p>
                )}
              </div>
              <div
                className="rounded-lg border p-4 space-y-1"
                style={{ fontFamily: watchedValues.fontFamily }}
              >
                <p className="text-xl font-bold" style={{ color: watchedValues.primaryColor }}>
                  Aperçu de la police
                </p>
                <p className="text-sm text-muted-foreground">
                  Ceci est un aperçu du rendu avec la police sélectionnée. Les titres, les paragraphes et les boutons utiliseront cette typographie.
                </p>
                <p className="text-lg font-semibold">Titre de section</p>
                <p className="text-xs">Texte de corps — Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="size-5 text-teal-600" />
                <div>
                  <CardTitle className="text-base">Logo</CardTitle>
                  <CardDescription>Téléchargez le logo de votre agence</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex-1 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-teal-400 hover:bg-teal-50/50 cursor-pointer">
                  <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Glissez-déposez votre logo ici
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, SVG ou JPG (max 2 Mo)
                  </p>
                </div>
                {branding?.brandLogoUrl && (
                  <div className="relative">
                    <img
                      src={branding.brandLogoUrl}
                      alt="Logo"
                      className="size-24 rounded-lg border object-contain bg-white p-2"
                    />
                    <button className="absolute -right-2 -top-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
                      <X className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="size-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Aperçu en direct</h3>
            </div>
            <LivePreview
              primaryColor={watchedValues.primaryColor}
              secondaryColor={watchedValues.secondaryColor}
              accentColor={watchedValues.accentColor}
              fontFamily={watchedValues.fontFamily}
              appName={watchedValues.appName}
            />
            <div className="mt-4 rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Palette actuelle
              </h4>
              <div className="flex gap-2">
                {[watchedValues.primaryColor, watchedValues.secondaryColor, watchedValues.accentColor].map(
                  (color, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div
                        className="h-10 rounded-lg border"
                        style={{ backgroundColor: color }}
                      />
                      <p className="mt-1 text-xs font-mono text-muted-foreground">{color}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
