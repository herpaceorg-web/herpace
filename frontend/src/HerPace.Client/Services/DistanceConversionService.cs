namespace HerPace.Client.Services;

public class DistanceConversionService
{
    private const decimal KmToMilesRatio = 0.621371m;
    private const decimal MilesToKmRatio = 1.60934m;

    /// <summary>
    /// Converts kilometers to miles.
    /// </summary>
    public static decimal KmToMiles(decimal kilometers)
    {
        return kilometers * KmToMilesRatio;
    }

    /// <summary>
    /// Converts miles to kilometers.
    /// </summary>
    public static decimal MilesToKm(decimal miles)
    {
        return miles * MilesToKmRatio;
    }

    /// <summary>
    /// Converts distance from one unit to another.
    /// </summary>
    public static decimal Convert(decimal distance, DistanceUnit fromUnit, DistanceUnit toUnit)
    {
        if (fromUnit == toUnit)
        {
            return distance;
        }

        return fromUnit == DistanceUnit.Kilometers
            ? KmToMiles(distance)
            : MilesToKm(distance);
    }

    /// <summary>
    /// Formats distance with the appropriate unit label.
    /// </summary>
    public static string FormatDistance(decimal distance, DistanceUnit unit, int decimalPlaces = 1)
    {
        var formatted = distance.ToString($"F{decimalPlaces}");
        var unitLabel = unit == DistanceUnit.Kilometers ? "km" : "mi";
        return $"{formatted} {unitLabel}";
    }
}

public enum DistanceUnit
{
    Kilometers,
    Miles
}
