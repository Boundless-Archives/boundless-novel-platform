"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getOtherEntitiesInUniverse,
  getRelationshipsForEntity,
  addRelationship,
  deleteRelationship,
} from "@/app/wiki/actions";
import { getEntityTypeIcon } from "@/lib/entityTypes";

type OtherEntity = {
  id: string;
  name: string;
  entity_type: string;
};

type RelationshipItem = {
  id: string;
  relationship_type: string;
  to_entity?: OtherEntity | OtherEntity[] | null;
  from_entity?: OtherEntity | OtherEntity[] | null;
};

type Props = {
  entityId: string;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function RelationshipManager({
  entityId,
}: Props) {
  const [otherEntities, setOtherEntities] = useState<OtherEntity[]>([]);
  const [outgoing, setOutgoing] = useState<RelationshipItem[]>([]);
  const [incoming, setIncoming] = useState<RelationshipItem[]>([]);
  const [targetEntityId, setTargetEntityId] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const [entities, relationships] = await Promise.all([
      getOtherEntitiesInUniverse(entityId),
      getRelationshipsForEntity(entityId),
    ]);

    setOtherEntities(entities);
    setOutgoing(relationships.outgoing as RelationshipItem[]);
    setIncoming(relationships.incoming as RelationshipItem[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  function handleAdd() {
    setErrorMessage("");

    startTransition(async () => {
      try {
        await addRelationship(
          entityId,
          targetEntityId,
          relationshipType
        );
        setTargetEntityId("");
        setRelationshipType("");
        await refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      }
    });
  }

  function handleDelete(relationshipId: string) {
    startTransition(async () => {
      try {
        await deleteRelationship(relationshipId);
        await refresh();
      } catch (error) {
        console.error(error);
      }
    });
  }

  if (loading) {
    return (
      <p className="text-sm opacity-60">
        Loading relationships...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {outgoing.length > 0 && (
        <div>
          <p className="text-sm font-medium opacity-70 mb-2">
            This entity...
          </p>

          <div className="space-y-2">
            {outgoing.map((relationship) => {
              const target = first(relationship.to_entity);

              return (
                <div
                  key={relationship.id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <span>
                    <strong>{relationship.relationship_type}</strong>{" "}
                    {target &&
                      `${getEntityTypeIcon(target.entity_type)} ${target.name}`}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(relationship.id)}
                    disabled={isPending}
                    className="text-xs opacity-60 hover:opacity-100 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {incoming.length > 0 && (
        <div>
          <p className="text-sm font-medium opacity-70 mb-2">
            Referenced by other entities as...
          </p>

          <div className="space-y-2">
            {incoming.map((relationship) => {
              const source = first(relationship.from_entity);

              return (
                <div
                  key={relationship.id}
                  className="rounded-lg border p-3 text-sm opacity-80"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  {source &&
                    `${getEntityTypeIcon(source.entity_type)} ${source.name}`}{" "}
                  — <strong>{relationship.relationship_type}</strong> this
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium opacity-70 mb-2">
          Add a relationship
        </p>

        {otherEntities.length === 0 ? (
          <p className="text-sm opacity-60">
            Create another entity in this universe first.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              placeholder="e.g. Member of, Sworn enemy of"
              className="flex-1 border rounded-lg p-2 text-sm"
            />

            <select
              value={targetEntityId}
              onChange={(e) => setTargetEntityId(e.target.value)}
              className="flex-1 border rounded-lg p-2 text-sm"
            >
              <option value="">Select entity...</option>

              {otherEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {getEntityTypeIcon(entity.entity_type)} {entity.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAdd}
              disabled={
                !targetEntityId || !relationshipType.trim() || isPending
              }
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--button)",
                color: "var(--button-text)",
              }}
            >
              Add
            </button>
          </div>
        )}

        {errorMessage && (
          <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}