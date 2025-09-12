import type { FieldFilter } from '$graphql/resolvers-types.js';
import type { GraphQLResolveInfo, FieldNode } from 'graphql';

export function extractFieldFiltersFromSelectionSet(info: GraphQLResolveInfo): Array<{ fieldName: string; filter: FieldFilter }> {
  const fieldFilters: Array<{ fieldName: string; filter: FieldFilter }> = [];
  
  // Find the entries field in the selection set
  const selectionSet = info.fieldNodes[0]?.selectionSet;
  if (!selectionSet) return fieldFilters;
  
  const entriesField = selectionSet.selections.find(
    (selection): selection is FieldNode => 
      selection.kind === 'Field' && selection.name.value === 'entries'
  );
  
  if (!entriesField?.selectionSet) return fieldFilters;
  
  // Look for field selections within entries
  entriesField.selectionSet.selections.forEach((selection) => {
    if (selection.kind === 'Field' && selection.name.value === 'field') {
      // Extract field name and filter from arguments
      const nameArg = selection.arguments?.find(arg => arg.name.value === 'name');
      const filterArg = selection.arguments?.find(arg => arg.name.value === 'filter');
      
      if (nameArg?.value.kind === 'StringValue' && filterArg?.value.kind === 'ObjectValue') {
        const fieldName = nameArg.value.value;
        const filter: FieldFilter = {};
        
        // Parse nested filter object structure
        filterArg.value.fields.forEach((typeField) => {
          if (typeField.value.kind === 'ObjectValue') {
            const filterType = typeField.name.value as keyof FieldFilter;
            const filterValues: any = {};
            
            typeField.value.fields.forEach((filterField) => {
              if (filterField.value.kind === 'StringValue') {
                filterValues[filterField.name.value] = filterField.value.value;
              } else if (filterField.value.kind === 'IntValue') {
                filterValues[filterField.name.value] = parseInt(filterField.value.value);
              } else if (filterField.value.kind === 'BooleanValue') {
                filterValues[filterField.name.value] = filterField.value.value;
              } else if (filterField.value.kind === 'ListValue') {
                const listValues = filterField.value.values.map(v => {
                  if (v.kind === 'StringValue') return v.value;
                  if (v.kind === 'IntValue') return parseInt(v.value);
                  return null;
                }).filter(v => v !== null);
                filterValues[filterField.name.value] = listValues;
              }
            });
            
            (filter as any)[filterType] = filterValues;
          }
        });
        
        fieldFilters.push({ fieldName, filter });
      }
    }
  });
  
  return fieldFilters;
}