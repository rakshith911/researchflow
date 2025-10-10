#!/bin/bash
sed -i.bak '
s/createdAt: Date$/createdAt: string/g
s/updatedAt: Date$/updatedAt: string/g
s/lastAccessedAt?: Date$/lastAccessedAt?: string/g
s/lastSaved: Date$/lastSaved: string/g
s/lastSaved: new Date()/lastSaved: new Date().toISOString()/g
s/updatedAt: new Date()/updatedAt: new Date().toISOString()/g
' document-store.ts
