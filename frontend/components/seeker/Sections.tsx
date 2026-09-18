"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import {
  seekerCertificates,
  seekerEducations,
  seekerExperiences,
  seekerLanguages,
  seekerPortfolio,
} from "@/lib/api/endpoints";
import type {
  SeekerCertificate,
  SeekerEducation,
  SeekerExperience,
  SeekerLanguage,
  SeekerPortfolioItem,
} from "@/lib/api/types";
import SectionCard from "./SectionCard";
import { Check, Field, Grid, Select, TextArea, period } from "./Fields";
import { checked, text, useSection } from "./useSection";

/**
 * The five repeating sections of a candidate's profile.
 *
 * Each is the same card with different fields; the shape lives in SectionCard
 * and the loading and saving in useSection, so what remains here is only what
 * genuinely differs between them.
 */

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

const PROFICIENCY = [
  { value: "basic", label: "Basic" },
  { value: "conversational", label: "Conversational" },
  { value: "professional", label: "Professional" },
  { value: "fluent", label: "Fluent" },
  { value: "native", label: "Native" },
];

export function ExperienceSection({ enabled }: { enabled: boolean }) {
  const { rows, save, remove } = useSection<SeekerExperience>(
    seekerExperiences,
    enabled,
  );

  return (
    <SectionCard
      title="Work experience"
      addLabel="Add role"
      emptyHint="Add the roles you have held — this is the first thing an employer reads."
      rows={rows}
      renderRow={(row) => (
        <>
          <p className="font-medium text-slate-900">{row.job_title}</p>
          <p className="text-sm text-slate-600">
            {row.company_name}
            {row.location ? ` · ${row.location}` : ""}
          </p>
          <p className="text-xs text-slate-400">
            {period(row.started_on, row.ended_on, row.is_current)}
          </p>
          {row.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-500">
              {row.description}
            </p>
          )}
        </>
      )}
      renderForm={(editing) => (
        <Grid>
          <Field
            label="Job title"
            name="job_title"
            required
            defaultValue={editing?.job_title}
          />
          <Field
            label="Company"
            name="company_name"
            required
            defaultValue={editing?.company_name}
          />
          <Field
            label="Location"
            name="location"
            defaultValue={editing?.location}
          />
          <Select
            label="Employment type"
            name="employment_type"
            defaultValue={editing?.employment_type}
            options={EMPLOYMENT_TYPES}
          />
          <Field
            label="Started"
            name="started_on"
            type="date"
            defaultValue={editing?.started_on}
          />
          <Field
            label="Ended"
            name="ended_on"
            type="date"
            defaultValue={editing?.ended_on}
          />
          <Check
            label="I currently work here"
            name="is_current"
            defaultChecked={editing?.is_current}
          />
          <TextArea
            label="What you did"
            name="description"
            defaultValue={editing?.description}
          />
        </Grid>
      )}
      onSubmit={(editing, form) =>
        save(editing, {
          job_title: text(form, "job_title"),
          company_name: text(form, "company_name"),
          location: text(form, "location"),
          employment_type: text(form, "employment_type"),
          started_on: text(form, "started_on"),
          ended_on: text(form, "ended_on"),
          is_current: checked(form, "is_current"),
          description: text(form, "description"),
        })
      }
      onDelete={remove}
    />
  );
}

export function EducationSection({ enabled }: { enabled: boolean }) {
  const { rows, save, remove } = useSection<SeekerEducation>(
    seekerEducations,
    enabled,
  );

  return (
    <SectionCard
      title="Education"
      addLabel="Add qualification"
      emptyHint="Add your degrees and diplomas."
      rows={rows}
      renderRow={(row) => (
        <>
          <p className="font-medium text-slate-900">
            {row.degree ?? row.institution}
            {row.field_of_study ? ` · ${row.field_of_study}` : ""}
          </p>
          {row.degree && (
            <p className="text-sm text-slate-600">{row.institution}</p>
          )}
          <p className="text-xs text-slate-400">
            {period(row.started_on, row.ended_on, row.is_current)}
            {row.grade ? ` · ${row.grade}` : ""}
          </p>
        </>
      )}
      renderForm={(editing) => (
        <Grid>
          <Field
            label="Institution"
            name="institution"
            required
            defaultValue={editing?.institution}
          />
          <Field label="Degree" name="degree" defaultValue={editing?.degree} />
          <Field
            label="Field of study"
            name="field_of_study"
            defaultValue={editing?.field_of_study}
          />
          <Field label="Grade" name="grade" defaultValue={editing?.grade} />
          <Field
            label="Started"
            name="started_on"
            type="date"
            defaultValue={editing?.started_on}
          />
          <Field
            label="Ended"
            name="ended_on"
            type="date"
            defaultValue={editing?.ended_on}
          />
          <Check
            label="I am still studying here"
            name="is_current"
            defaultChecked={editing?.is_current}
          />
        </Grid>
      )}
      onSubmit={(editing, form) =>
        save(editing, {
          institution: text(form, "institution"),
          degree: text(form, "degree"),
          field_of_study: text(form, "field_of_study"),
          grade: text(form, "grade"),
          started_on: text(form, "started_on"),
          ended_on: text(form, "ended_on"),
          is_current: checked(form, "is_current"),
        })
      }
      onDelete={remove}
    />
  );
}

export function CertificateSection({ enabled }: { enabled: boolean }) {
  const { rows, save, remove } = useSection<SeekerCertificate>(
    seekerCertificates,
    enabled,
  );

  return (
    <SectionCard
      title="Certifications & licences"
      addLabel="Add certificate"
      emptyHint="Offshore and HSE roles often require a specific ticket — list yours here."
      rows={rows}
      renderRow={(row) => (
        <>
          <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
            {row.name}
            {/*
              An expired ticket does not qualify the holder, so it is called
              out rather than left for the reader to work out from the date.
            */}
            {row.is_expired && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <AlertTriangle size={11} /> Expired
              </span>
            )}
          </p>
          {row.issuer && <p className="text-sm text-slate-600">{row.issuer}</p>}
          <p className="text-xs text-slate-400">
            {period(row.issued_on, row.expires_on, false)}
          </p>
          {row.credential_url && (
            <a
              href={row.credential_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              View credential <ExternalLink size={11} />
            </a>
          )}
        </>
      )}
      renderForm={(editing) => (
        <Grid>
          <Field
            label="Name"
            name="name"
            required
            defaultValue={editing?.name}
          />
          <Field
            label="Issuing body"
            name="issuer"
            defaultValue={editing?.issuer}
          />
          <Field
            label="Credential ID"
            name="credential_id"
            defaultValue={editing?.credential_id}
          />
          <Field
            label="Credential URL"
            name="credential_url"
            type="url"
            placeholder="https://"
            defaultValue={editing?.credential_url}
          />
          <Field
            label="Issued"
            name="issued_on"
            type="date"
            defaultValue={editing?.issued_on}
          />
          <Field
            label="Expires"
            name="expires_on"
            type="date"
            defaultValue={editing?.expires_on}
          />
        </Grid>
      )}
      onSubmit={(editing, form) =>
        save(editing, {
          name: text(form, "name"),
          issuer: text(form, "issuer"),
          credential_id: text(form, "credential_id"),
          credential_url: text(form, "credential_url"),
          issued_on: text(form, "issued_on"),
          expires_on: text(form, "expires_on"),
        })
      }
      onDelete={remove}
    />
  );
}

export function LanguageSection({ enabled }: { enabled: boolean }) {
  const { rows, save, remove } = useSection<SeekerLanguage>(
    seekerLanguages,
    enabled,
  );

  return (
    <SectionCard
      title="Languages"
      addLabel="Add language"
      emptyHint="Which languages can you work in?"
      rows={rows}
      renderRow={(row) => (
        <p className="font-medium text-slate-900">
          {row.language}
          {row.proficiency && (
            <span className="ml-2 text-sm font-normal capitalize text-slate-500">
              {row.proficiency}
            </span>
          )}
        </p>
      )}
      renderForm={(editing) => (
        <Grid>
          <Field
            label="Language"
            name="language"
            required
            defaultValue={editing?.language}
          />
          <Select
            label="Proficiency"
            name="proficiency"
            defaultValue={editing?.proficiency}
            options={PROFICIENCY}
          />
        </Grid>
      )}
      onSubmit={(editing, form) =>
        save(editing, {
          language: text(form, "language"),
          proficiency: text(form, "proficiency"),
        })
      }
      onDelete={remove}
    />
  );
}

export function PortfolioSection({ enabled }: { enabled: boolean }) {
  const { rows, save, remove } = useSection<SeekerPortfolioItem>(
    seekerPortfolio,
    enabled,
  );

  return (
    <SectionCard
      title="Projects & portfolio"
      addLabel="Add project"
      emptyHint="Link the work you are proudest of."
      rows={rows}
      renderRow={(row) => (
        <>
          <p className="font-medium text-slate-900">{row.title}</p>
          {row.description && (
            <p className="whitespace-pre-line text-sm text-slate-500">
              {row.description}
            </p>
          )}
          {row.url && (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              Open <ExternalLink size={11} />
            </a>
          )}
        </>
      )}
      renderForm={(editing) => (
        <Grid>
          <Field
            label="Title"
            name="title"
            required
            defaultValue={editing?.title}
            span
          />
          <Field
            label="Link"
            name="url"
            type="url"
            placeholder="https://"
            defaultValue={editing?.url}
          />
          <Field
            label="Completed"
            name="completed_on"
            type="date"
            defaultValue={editing?.completed_on}
          />
          <TextArea
            label="Description"
            name="description"
            defaultValue={editing?.description}
          />
        </Grid>
      )}
      onSubmit={(editing, form) =>
        save(editing, {
          title: text(form, "title"),
          url: text(form, "url"),
          completed_on: text(form, "completed_on"),
          description: text(form, "description"),
        })
      }
      onDelete={remove}
    />
  );
}
