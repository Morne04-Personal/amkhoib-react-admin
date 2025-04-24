export const normaliseString = (input: string): string => {
    // Remove all non-alphanumeric characters
    const cleanedString = input.replace(/[^a-zA-Z0-9]/g, " ");
  
    // Split camelCased text into separate words
    const splitCamelCase = cleanedString.replace(/([a-z])([A-Z])/g, "$1 $2");
  
    // Split the resulting string into words
    const words = splitCamelCase.split(/\s+/);
  
    // Apply title-casing to each word
    const titleCasedWords = words.map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  
    // Join the words back into a single string
    return titleCasedWords.join(" ");
  };
  
  export const trimCharacters = (str: string, char: string): string => {
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special characters for regex
    const regex = new RegExp(`^[${escapedChar}]+|[${escapedChar}]+$`, "g");
    return str.replace(regex, "");
  };