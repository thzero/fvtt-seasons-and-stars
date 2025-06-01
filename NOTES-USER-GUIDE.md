# Seasons & Stars Notes System - User Guide

## Introduction

The Seasons & Stars Notes System provides powerful calendar-integrated note management for your Foundry VTT games. Whether you're tracking important events, managing recurring activities, or organizing campaign information, the notes system helps you stay organized and ensures nothing important is forgotten.

## Getting Started

### Accessing the Notes System

Notes are tightly integrated with the Seasons & Stars calendar widgets. You can create and manage notes directly from:

1. **Calendar Grid Widget**: Click on any date to see notes and create new ones
2. **Calendar Mini Widget**: Shows note indicators for quick reference
3. **Journal Directory**: Notes are stored as standard Foundry journal entries

### Your First Note

1. Open the Calendar Grid Widget
2. Hover over any date - you'll see a **+** button appear
3. Click the **+** button to create a new note
4. Fill in the note details:
   - **Title**: A brief, descriptive name
   - **Content**: Detailed information about the note
   - **Category**: Choose from predefined categories or create custom ones
   - **All Day**: Whether the note applies to the entire day
   - **Player Visible**: Whether players can see this note

## Note Categories

Organize your notes with categories to keep related information together.

### Built-in Categories

- 🗒️ **General**: General notes and reminders
- 📅 **Event**: Important events and meetings
- ⏰ **Reminder**: Personal reminders and tasks
- 🌤️ **Weather**: Weather-related information (integrates with Simple Weather)
- 📖 **Story**: Story beats and narrative notes
- ⚔️ **Combat**: Combat encounters and tactics
- 🗺️ **Travel**: Travel plans and journey notes
- 👥 **NPC**: NPC information and interactions

### Custom Categories

Create your own categories to match your campaign's needs:

1. Use the category dropdown when creating a note
2. Type a new category name that doesn't exist
3. The system will automatically create the custom category
4. Custom categories are saved and available for future notes

## Working with Notes

### Creating Notes

#### Quick Notes
- Hover over any date in the calendar
- Click the **+** button for instant note creation
- Perfect for rapid session notes or sudden inspirations

#### Detailed Notes
- Use the full creation dialog for complex notes
- Add categories, tags, and detailed content
- Set up recurring patterns for regular events

### Editing Notes

1. Click on any existing note indicator in the calendar
2. Select the note you want to edit from the list
3. Make your changes and save
4. Changes are immediately reflected in the calendar

### Deleting Notes

- Open the note for editing
- Click the **Delete** button
- Confirm the deletion
- For recurring notes, choose whether to delete just one occurrence or the entire series

## Recurring Events

Perfect for tracking regular campaign activities like market days, festivals, or recurring meetings.

### Setting Up Recurring Notes

1. Create a new note as normal
2. Check the **Recurring** option
3. Choose your pattern:
   - **Daily**: Every day, every other day, etc.
   - **Weekly**: Specific days of the week
   - **Monthly**: Same date each month or specific weekdays (e.g., "first Monday")
   - **Yearly**: Annual events like holidays

### Recurring Pattern Examples

#### Weekly Town Council Meeting
- **Frequency**: Weekly
- **Days**: Monday
- **End Date**: End of campaign or specific date

#### Monthly Market Day
- **Frequency**: Monthly
- **Pattern**: First Saturday of each month
- **Duration**: Ongoing

#### Annual Festival
- **Frequency**: Yearly
- **Date**: Same calendar date each year
- **Duration**: Multiple days if needed

### Managing Recurring Notes

- **View All Occurrences**: See all instances of a recurring event
- **Edit Series**: Change the pattern for all future occurrences
- **Edit Single**: Modify just one occurrence without affecting others
- **Delete Series**: Remove all occurrences of a recurring event

## Tags and Organization

### Using Tags

Tags provide flexible organization beyond categories:

- **Important**: Mark critical information
- **Urgent**: Time-sensitive notes
- **Party**: Information relevant to the entire party
- **Secret**: GM-only information
- **Plot**: Major story elements
- **Custom Tags**: Create your own organizational system

### Tag Best Practices

1. **Be Consistent**: Use the same tags across similar notes
2. **Keep It Simple**: Don't over-tag; 2-4 tags per note is usually sufficient
3. **Think Searchable**: Use tags you'll remember when searching later
4. **Combine with Categories**: Tags complement categories for powerful organization

## Searching and Finding Notes

### Quick Search

Use the search function to quickly find notes:

1. Type keywords in the search box
2. Results appear instantly as you type
3. Search covers both titles and content
4. Click any result to jump to that note

### Advanced Filtering

Filter notes by multiple criteria:

- **Date Range**: Show notes from specific time periods
- **Categories**: Filter by one or more categories
- **Tags**: Find notes with specific tags
- **Visibility**: Show only player-visible or GM-only notes
- **Author**: Filter by who created the note

### Search Tips

- **Use Quotes**: Search for exact phrases with quotation marks
- **Combine Filters**: Use multiple criteria to narrow results
- **Save Searches**: Bookmark commonly used search combinations
- **Recent Notes**: Quick access to recently created or modified notes

## Player vs GM Notes

### Player-Visible Notes

These notes can be seen by players and are perfect for:
- Public events and festivals
- Town announcements
- Shared party goals
- Campaign calendar events

### GM-Only Notes

Keep these notes private for:
- Plot developments
- NPC motivations
- Secret information
- Behind-the-scenes planning

### Managing Visibility

- Set visibility when creating notes
- Change visibility later by editing the note
- Use different categories for public vs private information
- Consider player knowledge when deciding visibility

## Integration with Other Modules

### Simple Weather

The notes system automatically integrates with Simple Weather:

1. Enable "Store in Simple Calendar Notes" in Simple Weather settings
2. Weather data is automatically stored as notes
3. Weather notes appear in your calendar with special indicators
4. Historical weather information is preserved and searchable

### Other Calendar Modules

The notes system provides Simple Calendar API compatibility, meaning modules designed for Simple Calendar will work with Seasons & Stars notes:

- **SmallTime**: Enhanced time display with note indicators
- **Calendar/Weather**: Weather modules that support calendar integration
- **Custom Modules**: Any module using Simple Calendar's notes API

## Performance and Large Collections

### Optimizing for Many Notes

As your campaign grows, you may accumulate hundreds or thousands of notes. The system is designed to handle large collections efficiently:

#### Automatic Optimization
- The system automatically optimizes when it detects large collections (500+ notes)
- Indexing and caching improve search speed
- Memory management prevents performance issues

#### Manual Optimization
If you notice performance issues:
1. Use date-based searches instead of searching all notes
2. Limit search results with specific criteria
3. Regularly clean up old, unnecessary notes
4. Use categories to organize large collections

### Performance Monitoring

Monitor system performance:
- Check search response times
- Monitor memory usage
- Use performance metrics for optimization decisions

## Tips and Best Practices

### Effective Note-Taking

1. **Use Descriptive Titles**: Make notes easy to find later
2. **Include Context**: Add enough detail for future reference
3. **Link Related Notes**: Reference other notes or journal entries
4. **Regular Cleanup**: Remove outdated or irrelevant notes
5. **Consistent Categories**: Develop a category system and stick to it

### Campaign Management

1. **Session Preparation**: Create reminder notes for upcoming sessions
2. **Player Information**: Use player-visible notes for shared knowledge
3. **Story Tracking**: Document major plot developments
4. **NPC Management**: Track NPC interactions and motivations
5. **World Building**: Record location details and local customs

### Collaboration with Players

1. **Shared Notes**: Use player-visible notes for party planning
2. **Character Goals**: Players can create personal reminder notes
3. **Campaign Timeline**: Maintain a shared calendar of events
4. **Communication**: Use notes to share information between sessions

## Troubleshooting

### Common Issues

#### Notes Not Appearing
- Check if you're looking at the correct date
- Verify the note's visibility settings
- Ensure the calendar is showing the right month/year

#### Performance Problems
- Too many notes loaded at once
- Use date filters to limit results
- Consider archiving old notes

#### Search Not Working
- Check your search terms for typos
- Try broader search criteria
- Verify you're searching in the right date range

#### Recurring Notes Issues
- Verify the recurring pattern is set correctly
- Check for conflicting dates or limits
- Ensure the parent note wasn't accidentally deleted

### Getting Help

If you encounter issues:

1. **Check the Documentation**: Review this guide and the API documentation
2. **Community Support**: Ask questions in the Foundry VTT Discord
3. **Report Bugs**: Use the GitHub issues page for technical problems
4. **Feature Requests**: Suggest improvements through GitHub or Discord

## Advanced Features

### Bulk Operations

For power users managing large collections:

- **Batch Category Updates**: Change categories for multiple notes
- **Mass Tag Application**: Apply tags to groups of notes
- **Bulk Visibility Changes**: Update visibility for multiple notes
- **Export/Import**: Back up and restore note collections

### Custom Integration

If you're comfortable with macros or module development:

- **Custom Macros**: Create macros for common note operations
- **Module Development**: Build custom modules that integrate with the notes system
- **API Usage**: Use the notes API for advanced functionality
- **Data Export**: Extract notes data for external processing

### Automation

Set up automated workflows:

- **Scheduled Reminders**: Use recurring notes for regular reminders
- **Conditional Notes**: Create notes that appear based on game state
- **Integration Scripts**: Connect notes to other Foundry systems
- **Custom Workflows**: Develop processes that fit your campaign style

## Migration and Compatibility

### From Simple Calendar

If you're migrating from Simple Calendar:

1. **No Migration Needed**: Existing Simple Calendar notes continue to work
2. **Enhanced Features**: Gain access to categories, tags, and advanced search
3. **Gradual Transition**: Start using new features while keeping existing notes
4. **Full Compatibility**: All Simple Calendar modules continue to function

### Backup and Restore

Protect your notes:

1. **Regular Backups**: Include notes in your world backups
2. **Export Options**: Use Foundry's export features for note data
3. **Version Control**: Keep multiple backup versions
4. **Cloud Sync**: Use cloud storage for additional protection

## Conclusion

The Seasons & Stars Notes System transforms how you manage campaign information in Foundry VTT. By integrating notes directly with your calendar, you gain a powerful tool for organization, planning, and collaboration.

Start simple with basic notes and gradually explore advanced features like recurring events, custom categories, and powerful search capabilities. Your future self (and your players) will thank you for the organized, easily accessible information.

Remember: The best note system is the one you actually use. Start taking notes today, and let the system grow with your campaign's needs.

---

*For technical details and module development, see the [API Documentation](NOTES-API-DOCUMENTATION.md).*

*For support and community discussion, visit [docs.rayners.dev](https://docs.rayners.dev/seasons-and-stars/) or the Foundry VTT Discord.*