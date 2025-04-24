export interface NavItem {
    id: string | number;
    title: string;
    isChecked?: boolean;
  }
  
  export interface NavListProps {
    items: NavItem[];
    title?: string;
    onItemClick?: (item: NavItem) => void;
    onCheckboxChange?: (item: NavItem, checked: boolean) => void;
    onEditClick?: (item: NavItem) => void;
    onDeleteClick?: (item: NavItem) => void;
    showActions?: boolean;
    selected?: string | number;
    titleColor?: string;
    actionIconColor?: string;
    listItemHoverColor?: string;
    listItemSelectedColor?: string;
    loading?: boolean;
  }
  
  