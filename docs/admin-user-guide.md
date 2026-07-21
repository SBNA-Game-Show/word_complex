# Word Complex Admin Portal User Guide

**Admin URL:** https://word-complex.vercel.app/admin

> **Access:** Only users with the **Admin** role can access the Admin Portal.

---

## Overview

The Word Complex Admin Portal allows administrators to manage stories used in the Word Complex application.

Using the portal, administrators can:

- Upload stories
- Download stories from supported online resources
- View tokenized stories
- Edit Sanskrit and English tokenized data
- Create and manage Story Sets

---

## Main Admin Page

The Admin Dashboard contains the following sections:

- Upload Story
- Stories from LearnSanskrit.cc
- Stories from Sanskrit.Samskrutam.com
- Get Tokenized Stories
- Refresh
- Edit Tokenized Stories

---

## Uploading a Story

### Supported File Types

- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- JSON (`.json`)

### Steps

1. Click **Choose File**.
2. Select a supported file.
3. Click **Upload**.

The system automatically:

- Cleans the content
- Parses the story
- Tokenizes both Sanskrit and English text
- Stores the processed story in the MongoDB `tokenized_stories` collection

The uploaded story becomes available under **Get Tokenized Stories**.

---

## Downloading Stories from Online Resources

The portal supports downloading stories from:

- LearnSanskrit.cc
- Sanskrit.Samskrutam.com

For any available story:

1. Click **Download**.
2. The system automatically:
   - Downloads the story
   - Cleans the content
   - Parses the story
   - Tokenizes the Sanskrit and English text
   - Stores the processed story in the `tokenized_stories` collection

---

## Retrieving New Stories

If new stories are available from the supported resources:

1. Click **Write Metadata**.
2. Wait for the process to finish.
3. Click **Refresh**.

The latest stories will appear in the resource list.

---

## Viewing Tokenized Stories

Click **Get Tokenized Stories** to display all stories stored in the `tokenized_stories` collection.

---

## Creating Story Sets

Story Sets determine which stories are available inside the Word Complex application.

### Steps

1. Select **1–4** tokenized stories.
2. Enter a Story Set name.
3. Click **Create & Activate Story Set**.
4. Repeat the process to create additional Story Sets if required.

> **Note:** Only **one Story Set** can be active at any time.

The active Story Set is automatically used by the Word Complex application.

---

## Managing Story Sets

Administrators can:

- Create Story Sets
- Activate a Story Set
- Delete existing Story Sets

Changing the active Story Set immediately changes the stories available to players.

---

## Editing Tokenized Stories

Click **Edit Tokenized Stories** to open stories from the `tokenized_stories` collection.

Expand a story using the arrow beside its title.

### Sanskrit Token Editor

The Sanskrit editor allows you to:

- Modify token text
- Update UPOS (Universal Part of Speech)
- Edit supported linguistic properties

### English Token Editor

The English editor is located below the Sanskrit editor.

It allows you to:

- Expand or collapse the editor
- Edit English tokenized text
- Modify token information using the same workflow

Both editors use color coding to distinguish Parts of Speech (POS), including:

- Nouns
- Verbs
- Adjectives
- Pronouns
- Other supported POS types

---

## Saving Changes

After making edits:

1. Click **Save Changes**.

The updated tokenized story is saved back to the MongoDB `tokenized_stories` collection.

---

## Best Practices

- Review uploaded stories before creating Story Sets.
- Verify Sanskrit and English tokenization after editing.
- Keep only one Story Set active.
- Refresh metadata regularly to retrieve newly available stories.
- Edit stories only when changes are required.

---

## Workflow Summary

```text
Upload Story
      │
      ▼
Clean Content
      │
      ▼
Parse Story
      │
      ▼
Tokenize Sanskrit & English
      │
      ▼
Save to tokenized_stories
      │
      ▼
Review / Edit (Optional)
      │
      ▼
Create Story Set
      │
      ▼
Activate Story Set
      │
      ▼
Stories Available in the Word Complex Application
```