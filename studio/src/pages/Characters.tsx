import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, EmptyState } from '../components/layout';
import { Card, Button, Badge, ConfirmDialog } from '../components/ui';
import { getCharacters, deleteCharacter, getCharacterImages } from '../services/storage';
import type { Character } from '../types';

export function Characters() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);

  useEffect(() => {
    setCharacters(getCharacters());
  }, []);

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCharacter(deleteTarget.id);
      setCharacters(getCharacters());
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Characters"
        subtitle={`${characters.length} character${characters.length !== 1 ? 's' : ''}`}
        icon="👥"
      />

      {characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={() => navigate(`/characters/${character.id}/edit`)}
              onDelete={() => setDeleteTarget(character)}
              onViewGallery={() => navigate(`/gallery/${character.id}`)}
            />
          ))}
          {/* Add Character Card */}
          <button
            type="button"
            onClick={() => navigate('/characters/new')}
            className="flex flex-col items-center justify-center gap-2 min-h-[280px] border-2 border-dashed border-gray-300 dark:border-dark-border rounded bg-gray-50 dark:bg-dark-tertiary/50 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <span className="text-4xl text-gray-400 dark:text-gray-500">➕</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Add Character</span>
          </button>
        </div>
      ) : (
        <EmptyState
          icon="👤"
          title="No characters yet"
          description="Create your first character to get started"
          action={
            <Button variant="primary" onClick={() => navigate('/characters/new')}>
              Create Character
            </Button>
          }
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Character"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all associated images.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

// Character card component
interface CharacterCardProps {
  character: Character;
  onEdit: () => void;
  onDelete: () => void;
  onViewGallery: () => void;
}

function CharacterCard({ character, onEdit, onDelete, onViewGallery }: CharacterCardProps) {
  const images = getCharacterImages(character.id);
  const templateColors = {
    dandy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    passport: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    classic: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const templateIcons = {
    dandy: '🎮',
    passport: '🎓',
    classic: '📝',
  };

  return (
    <Card className="overflow-hidden">
      {/* Portrait */}
      <div className="relative h-48 -m-4 mb-3 bg-gray-100 dark:bg-dark-tertiary">
        {character.portraitUrl ? (
          <img
            src={character.portraitUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
            👤
          </div>
        )}

        {/* Template badge */}
        <div className="absolute top-2 right-2">
          <Badge className={templateColors[character.template]}>
            {templateIcons[character.template]} {character.template}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="pt-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {character.name}
        </h3>
        {character.age && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Age: {character.age}
          </p>
        )}
        {character.aboutQuick && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {character.aboutQuick}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{images.length} images</span>
          <span>•</span>
          <span>{character.category}</span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit} className="flex-1">
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={onViewGallery} className="flex-1">
            Gallery
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            🗑️
          </Button>
        </div>
      </div>
    </Card>
  );
}
