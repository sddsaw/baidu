export interface TreeNodeItem {
  id: string
  name: string
  type: 'board' | 'group' | 'item'
  checked: boolean
  indeterminate?: boolean
  expanded: boolean
  children?: TreeNodeItem[]
}

export interface FlattenedLeftNode extends TreeNodeItem {
  depth: number
  hasChildren: boolean
}

export interface RightGridNode {
  id: string
  name: string
  status: string
  temp: string
  date: string
  nextDate: string
  expanded: boolean
  children?: RightGridNode[]
}

export interface FlattenedRightNode extends RightGridNode {
  depth: number
  hasChildren: boolean
}

export interface LogEntry {
  id: number
  text: string
  colorClass?: string
}
