export const createJsonForMobile = (
  documentId: string,
  stepsData: Array<{ title: string; fields: any[] }>,
  preview: boolean,
): { documentId: string; data: Step[] } => {
  
  console.log('Steps Data:', stepsData);	
  const getExampleValue = (type: string, options: any[], tagname: string): any => {
    switch (type) {
      case 'Number':
        return 123;
      case 'Date':
        return new Date().toISOString().split('T')[0];
      case 'Image':
        if(tagname?.includes('logo') || tagname?.includes('Logo')){
          return 'https://db.amkhoib.org/storage/v1/object/public/files/Generic-Logo.png';
        }
        return 'https://db.amkhoib.org/storage/v1/object/public/files/fake-signature.png';
      default:
        return options.length > 0 ? options[0] : 'Example Text';
    }
  };

  const transformCamelCase = (input: string): string => {
    return input
    // Insert space between lowercase and uppercase
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Insert space before capitalized word following a series of capitals
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Insert space between digits and letters
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2');
  }
  

  const dataSteps: any[] = stepsData.map<any>(step => {
    const repeatableGroups: { [key: string]: RepeatableField } = {};
    const processedFields: Array<FormField | RepeatableField> = [];

    step.fields.forEach(field => {
      const [groupName, fieldName] = field.full_tag_name.split('.');
      const exampleValue = preview ? getExampleValue(field?.type ? field.type : field?.field?.type, field.options, field?.full_tag_name) : field.value || '';

      
      const formField: FormField = {
        key: fieldName ? fieldName : field.full_tag_name,
        type: field?.type ? field.type : field?.field?.type,
        label: transformCamelCase(field.full_tag_name),
        value: exampleValue,
        required: field.required,
        order: field.order || 0,
        options: field.options || [],
        field_type_id: field.field_type_id,
        full_tag_name: field.full_tag_name,
      };

      if (fieldName) {
        if (!repeatableGroups[groupName]) {
          repeatableGroups[groupName] = {
            type: "Repeatable",
            label: groupName,
            key: groupName,
            fields: [],
          };
        }
        repeatableGroups[groupName].fields.push(formField);
      } else {
        processedFields.push(formField);
      }
    });

    Object.values(repeatableGroups).forEach(group => {
      if (preview && group.fields.length > 0) {
        group.value = [
          group.fields.reduce((acc, field) => {
            acc[field.key] = getExampleValue(field.type, field.options);
            return acc;
          }, {}),
          group.fields.reduce((acc, field) => {
            acc[field.key] = getExampleValue(field.type, field.options);
            return acc;
          }, {})
        ];
      }
      processedFields.push(group);
    });

    return {
      title: step.title,
      fields: processedFields,
    };
  });

  return { documentId, data: dataSteps };
};