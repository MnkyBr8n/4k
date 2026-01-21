import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Card, Button, Input, Textarea, Select } from '../components/ui';
import { saveCharacter, saveImage, logActivity } from '../services/storage';
import {
  generateCharacterId,
  generateImageId,
  DEFAULT_DANDY_STATS,
  type CategoryType,
  type CharacterFormData,
  type DandyStats,
} from '../types';

const STEPS = [
  { number: 1, label: 'Template' },
  { number: 2, label: 'Basic Info' },
  { number: 3, label: 'Details' },
  { number: 4, label: 'Portrait' },
];

export function CreateCharacter() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CharacterFormData>({
    template: 'classic',
    name: '',
    category: 'ocs',
    aboutQuick: '',
    pageLink: '',
    showInHero: false,
  });
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (updates: Partial<CharacterFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.template;
      case 2:
        return !!formData.name.trim();
      case 3:
        return true;
      case 4:
        return !!formData.portraitFile || !!formData.portraitUrl;
      default:
        return false;
    }
  };

  const handlePortraitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateForm({ portraitFile: file });
      const reader = new FileReader();
      reader.onload = (event) => {
        setPortraitPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const characterId = generateCharacterId();

      // Create character
      const character = {
        id: characterId,
        name: formData.name,
        age: formData.age,
        template: formData.template,
        category: formData.category,
        aboutQuick: formData.aboutQuick,
        dandy: formData.template === 'dandy' ? formData.dandy : undefined,
        passport: formData.template === 'passport' ? formData.passport : undefined,
        classic: formData.template === 'classic' ? formData.classic : undefined,
        pageLink: formData.pageLink,
        website: formData.website,
        portraitUrl: portraitPreview || undefined,
        showInHero: formData.showInHero,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveCharacter(character);

      // Save portrait as image if uploaded
      if (portraitPreview && formData.portraitFile) {
        const image = {
          id: generateImageId(),
          characterId,
          fileName: formData.portraitFile.name,
          album: 'digital' as const,
          url: portraitPreview,
          thumbnailUrl: portraitPreview,
          caption: '',
          altText: `${formData.name} portrait`,
          tags: ['portrait'],
          fileSize: formData.portraitFile.size,
          dimensions: { width: 0, height: 0 },
          colorPalette: [],
          isPortrait: true,
          isCarousel: formData.showInHero,
          carouselOrder: 0,
          uploadDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        saveImage(image);
      }

      logActivity('character_created', `Created character: ${formData.name}`);
      navigate('/characters');
    } catch (error) {
      console.error('Failed to create character:', error);
      alert('Failed to create character');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Character"
        action={
          <Button variant="secondary" onClick={() => navigate('/characters')}>
            Cancel
          </Button>
        }
      />

      {/* Wizard Steps */}
      <div className="flex justify-center gap-4 mb-8">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className={`flex flex-col items-center ${
              step.number <= currentStep ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step.number < currentStep
                  ? 'bg-success text-white'
                  : step.number === currentStep
                  ? 'bg-brand text-white'
                  : 'bg-gray-200 dark:bg-dark-tertiary text-gray-500'
              }`}
            >
              {step.number < currentStep ? '✓' : step.number}
            </div>
            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="max-w-2xl mx-auto">
        {/* Step 1: Template Selection */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Choose Template
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Select how you want this character displayed
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TemplateCard
                icon="🎮"
                title="Dandy"
                description="Game character with stats, abilities, health/hearts system"
                selected={formData.template === 'dandy'}
                onClick={() => updateForm({
                  template: 'dandy',
                  dandy: { abilities: '', aboutLong: '', stats: DEFAULT_DANDY_STATS },
                })}
              />
              <TemplateCard
                icon="🎓"
                title="Passport"
                description="University ID card style with academic info"
                selected={formData.template === 'passport'}
                onClick={() => updateForm({
                  template: 'passport',
                  passport: {
                    role: '', university: '', faculty: '', nationality: '',
                    placeOfBirth: '', dateOfBirth: '', motto: '', bio: '',
                  },
                })}
              />
              <TemplateCard
                icon="📝"
                title="Classic"
                description="Simple bio card with name, age, and description"
                selected={formData.template === 'classic'}
                onClick={() => updateForm({
                  template: 'classic',
                  classic: { dateOfBirth: '', placeOfBirth: '', bio: '' },
                })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Basic Information
            </h2>

            <div className="space-y-4">
              <Input
                label="Character Name"
                required
                placeholder="e.g., Anton Weiss, 4K, Fatigue..."
                value={formData.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                hint="This will be the main display name"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Age"
                  type="number"
                  min={1}
                  max={999}
                  placeholder="e.g., 25"
                  value={formData.age ?? ''}
                  onChange={(e) => updateForm({ age: e.target.value ? parseInt(e.target.value) : undefined })}
                />

                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => updateForm({ category: e.target.value as CategoryType })}
                  options={[
                    { value: 'ocs', label: 'Original Characters' },
                    { value: 'commissions', label: 'Commissions' },
                    { value: 'fanart', label: 'Fan Art' },
                    { value: 'progress', label: 'Work in Progress' },
                  ]}
                />
              </div>

              <Textarea
                label="Quick Description"
                placeholder="1-2 sentences that appear on gallery cards..."
                value={formData.aboutQuick}
                onChange={(e) => updateForm({ aboutQuick: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3: Template-Specific Details */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Additional Details
            </h2>

            {formData.template === 'dandy' && (
              <DandyFields
                data={formData.dandy}
                onChange={(dandy) => updateForm({ dandy })}
              />
            )}

            {formData.template === 'passport' && (
              <PassportFields
                data={formData.passport}
                onChange={(passport) => updateForm({ passport })}
              />
            )}

            {formData.template === 'classic' && (
              <ClassicFields
                data={formData.classic}
                onChange={(classic) => updateForm({ classic })}
              />
            )}

            {/* Common fields */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Page & Links
              </h3>
              <div className="space-y-4">
                <Select
                  label="Character Page Link"
                  value={formData.pageLink}
                  onChange={(e) => updateForm({ pageLink: e.target.value })}
                  options={[
                    { value: '', label: '-- No dedicated page --' },
                    { value: 'university', label: 'University (shared page)' },
                    { value: 'dandy', label: "Dandy's World (shared page)" },
                    { value: 'commissions', label: 'Commissions (shared page)' },
                  ]}
                  hint='Where the "Learn More" button goes'
                />

                <Input
                  label="Personal Website (Optional)"
                  type="url"
                  placeholder="https://..."
                  value={formData.website ?? ''}
                  onChange={(e) => updateForm({ website: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Portrait Upload */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Character Portrait
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Upload the main character image
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Upload Portrait Image <span className="text-warning">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePortraitChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-hover"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, WebP • Max 10MB • Recommended: 800x1000px or larger
                </p>
              </div>

              {portraitPreview && (
                <div className="p-4 bg-gray-50 dark:bg-dark-tertiary rounded">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Preview
                  </h4>
                  <img
                    src={portraitPreview}
                    alt="Portrait preview"
                    className="max-w-[200px] max-h-[250px] object-cover rounded mx-auto"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showInHero}
                  onChange={(e) => updateForm({ showInHero: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Show in Hero Carousel
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-border flex justify-between">
          {currentStep > 1 ? (
            <Button variant="secondary" onClick={() => setCurrentStep(currentStep - 1)}>
              ← Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              variant="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              Next →
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              isLoading={isSubmitting}
            >
              ✓ Create Character
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

// Template card component
interface TemplateCardProps {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function TemplateCard({ icon, title, description, selected, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg text-left border-2 transition-all ${
        selected
          ? 'border-brand bg-brand/5 dark:bg-brand/10'
          : 'border-gray-200 dark:border-dark-border hover:border-brand/50'
      }`}
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </button>
  );
}

// Dandy template fields
interface DandyFieldsProps {
  data?: { abilities: string; aboutLong: string; stats: DandyStats };
  onChange: (data: { abilities: string; aboutLong: string; stats: DandyStats }) => void;
}

function DandyFields({ data, onChange }: DandyFieldsProps) {
  const stats = data?.stats || DEFAULT_DANDY_STATS;

  const updateStats = (key: keyof DandyStats, value: number) => {
    onChange({
      abilities: data?.abilities || '',
      aboutLong: data?.aboutLong || '',
      stats: { ...stats, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <Textarea
        label="Abilities"
        placeholder="Describe the character's special abilities, powers, skills..."
        value={data?.abilities || ''}
        onChange={(e) => onChange({ ...data!, abilities: e.target.value })}
        rows={3}
      />

      <Textarea
        label="About / Backstory"
        placeholder="Full character description and backstory..."
        value={data?.aboutLong || ''}
        onChange={(e) => onChange({ ...data!, aboutLong: e.target.value })}
        rows={4}
      />

      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Character Stats</h4>
        <div className="space-y-3">
          <StatPicker label="Health" value={stats.health} max={10} icon="❤️" onChange={(v) => updateStats('health', v)} />
          <StatPicker label="Strength" value={stats.strength} max={5} icon="⭐" onChange={(v) => updateStats('strength', v)} />
          <StatPicker label="Speed" value={stats.speed} max={5} icon="⭐" onChange={(v) => updateStats('speed', v)} />
          <StatPicker label="Intelligence" value={stats.intelligence} max={5} icon="⭐" onChange={(v) => updateStats('intelligence', v)} />
          <StatPicker label="Charisma" value={stats.charisma} max={5} icon="⭐" onChange={(v) => updateStats('charisma', v)} />
        </div>
      </div>
    </div>
  );
}

// Stat picker component
interface StatPickerProps {
  label: string;
  value: number;
  max: number;
  icon: string;
  onChange: (value: number) => void;
}

function StatPicker({ label, value, max, icon, onChange }: StatPickerProps) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-dark-tertiary rounded">
      <span className="min-w-[100px] font-medium text-gray-900 dark:text-gray-100">{label}</span>
      <div className="flex gap-1 flex-1">
        {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={`text-xl transition-opacity ${i < value ? 'opacity-100' : 'opacity-30'}`}
          >
            {icon}
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">{value}/{max}</span>
    </div>
  );
}

// Passport template fields
interface PassportFieldsProps {
  data?: {
    role: string; university: string; faculty: string; nationality: string;
    placeOfBirth: string; dateOfBirth: string; motto: string; bio: string;
  };
  onChange: (data: PassportFieldsProps['data']) => void;
}

function PassportFields({ data, onChange }: PassportFieldsProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data!, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Role / Title" placeholder="e.g., Student, Professor" value={data?.role || ''} onChange={(e) => update('role', e.target.value)} />
        <Input label="University" placeholder="e.g., TUM, RWTH Aachen" value={data?.university || ''} onChange={(e) => update('university', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Faculty / Department" placeholder="e.g., Fakultät für Informatik" value={data?.faculty || ''} onChange={(e) => update('faculty', e.target.value)} />
        <Input label="Nationality" placeholder="e.g., Deutsch, American" value={data?.nationality || ''} onChange={(e) => update('nationality', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Place of Birth" placeholder="e.g., München, Bayern" value={data?.placeOfBirth || ''} onChange={(e) => update('placeOfBirth', e.target.value)} />
        <Input label="Date of Birth" type="date" value={data?.dateOfBirth || ''} onChange={(e) => update('dateOfBirth', e.target.value)} />
      </div>
      <Input label="Motto / Quote (Optional)" placeholder="A favorite saying or motto" value={data?.motto || ''} onChange={(e) => update('motto', e.target.value)} />
      <Textarea label="About / Bio" placeholder="Full description, interests, background..." value={data?.bio || ''} onChange={(e) => update('bio', e.target.value)} rows={4} />
    </div>
  );
}

// Classic template fields
interface ClassicFieldsProps {
  data?: { dateOfBirth: string; placeOfBirth: string; bio: string };
  onChange: (data: ClassicFieldsProps['data']) => void;
}

function ClassicFields({ data, onChange }: ClassicFieldsProps) {
  const update = (key: string, value: string) => {
    onChange({ ...data!, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date of Birth" type="date" value={data?.dateOfBirth || ''} onChange={(e) => update('dateOfBirth', e.target.value)} />
        <Input label="Place of Birth" placeholder="City, State/Country" value={data?.placeOfBirth || ''} onChange={(e) => update('placeOfBirth', e.target.value)} />
      </div>
      <Textarea label="Bio" placeholder="Character biography and description..." value={data?.bio || ''} onChange={(e) => update('bio', e.target.value)} rows={4} />
    </div>
  );
}
